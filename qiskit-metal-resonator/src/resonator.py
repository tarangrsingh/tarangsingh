"""Quarter-wave CPW readout resonator coupled to a feedline (qiskit-metal).

Layout (top view, chip 9 mm x 6 mm)::

    [launchpad]----[ coupled-line tee ]----[launchpad]     <- feedline
                          |
                      (open end)
                          ~  meandered lambda/4 CPW
                          ~
                      (short to ground)

Run ``python src/resonator.py --help`` for options.
"""
from __future__ import annotations

import argparse
from pathlib import Path

from qiskit_metal import designs
from qiskit_metal.qlibrary.couplers.coupled_line_tee import CoupledLineTee
from qiskit_metal.qlibrary.terminations.launchpad_wb import LaunchpadWirebond
from qiskit_metal.qlibrary.terminations.short_to_ground import ShortToGround
from qiskit_metal.qlibrary.tlines.meandered import RouteMeander
from qiskit_metal.qlibrary.tlines.straight_path import RouteStraight

from analysis import CPW, quarter_wave_length

OUTPUT = Path(__file__).resolve().parents[1] / "output"


def build_design(
    freq_ghz: float = 6.5,
    width_um: float = 10.0,
    gap_um: float = 6.0,
    coupling_length_um: float = 200.0,
    coupling_space_um: float = 3.0,
    meander_spacing_um: float = 100.0,
) -> tuple[designs.DesignPlanar, dict]:
    """Build the layout and return ``(design, info)``."""
    cpw = CPW(width=width_um * 1e-6, gap=gap_um * 1e-6)
    target_len_um = quarter_wave_length(freq_ghz * 1e9, cpw) * 1e6

    design = designs.DesignPlanar()
    design.overwrite_enabled = True
    design.chips.main.size.size_x = "9mm"
    design.chips.main.size.size_y = "6mm"
    design.variables["cpw_width"] = f"{width_um}um"
    design.variables["cpw_gap"] = f"{gap_um}um"

    # Feedline: launchpad -> straight -> tee -> straight -> launchpad
    lp_left = LaunchpadWirebond(
        design, "lp_left", options=dict(pos_x="-4mm", pos_y="0mm", orientation="0")
    )
    lp_right = LaunchpadWirebond(
        design, "lp_right", options=dict(pos_x="4mm", pos_y="0mm", orientation="180")
    )
    tee = CoupledLineTee(
        design,
        "tee",
        options=dict(
            pos_x="0mm",
            pos_y="0mm",
            prime_width=f"{width_um}um",
            prime_gap=f"{gap_um}um",
            second_width=f"{width_um}um",
            second_gap=f"{gap_um}um",
            coupling_length=f"{coupling_length_um}um",
            coupling_space=f"{coupling_space_um}um",
            open_termination=True,
        ),
    )
    RouteStraight(
        design,
        "feed_left",
        options=dict(
            pin_inputs=dict(
                start_pin=dict(component="lp_left", pin="tie"),
                end_pin=dict(component="tee", pin="prime_start"),
            )
        ),
    )
    RouteStraight(
        design,
        "feed_right",
        options=dict(
            pin_inputs=dict(
                start_pin=dict(component="tee", pin="prime_end"),
                end_pin=dict(component="lp_right", pin="tie"),
            )
        ),
    )

    # Resonator: the tee's open-ended arm continues as a meander to a short.
    # The tee arm already contributes roughly coupling_length + down_length.
    arm_um = coupling_length_um + float(tee.options.down_length.rstrip("um"))
    meander_len_um = target_len_um - arm_um
    short = ShortToGround(
        design, "short", options=dict(pos_x="1.5mm", pos_y="-2.0mm", orientation="0")
    )
    RouteMeander(
        design,
        "resonator",
        options=dict(
            total_length=f"{meander_len_um}um",
            pin_inputs=dict(
                start_pin=dict(component="tee", pin="second_end"),
                end_pin=dict(component="short", pin="short"),
            ),
            lead=dict(start_straight="150um", end_straight="150um"),
            meander=dict(spacing=f"{meander_spacing_um}um", asymmetry="0um"),
            fillet="49um",
        ),
    )

    routed_um = design.components["resonator"].length * 1e3  # mm -> um
    info = dict(
        target_freq_ghz=freq_ghz,
        impedance_ohm=cpw.impedance,
        eps_eff=cpw.eps_eff,
        quarter_wave_length_um=target_len_um,
        meander_length_um=meander_len_um,
        routed_meander_um=routed_um,
    )
    return design, info


def export_gds(design: designs.DesignPlanar, path: Path) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    design.renderers.gds.export_to_gds(str(path))
    return path


def save_preview(design: designs.DesignPlanar, path: Path) -> Path:
    """Headless PNG of the layout (no Qt GUI needed)."""
    import matplotlib

    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    tables = design.qgeometry.tables
    fig, ax = plt.subplots(figsize=(12, 5))
    for geom in tables["poly"].geometry:
        ax.fill(*geom.exterior.xy, color="tab:blue", lw=0)
    for geom, width in zip(tables["path"].geometry, tables["path"].width):
        ax.fill(*geom.buffer(width / 2).exterior.xy, color="tab:blue", lw=0)
    ax.set_aspect("equal")
    ax.set_xlabel("x (mm)")
    ax.set_ylabel("y (mm)")
    fig.savefig(path, dpi=150, bbox_inches="tight")
    plt.close(fig)
    return path


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    p.add_argument("--freq", type=float, default=6.5, help="target frequency, GHz")
    p.add_argument("--width", type=float, default=10.0, help="CPW centre width, um")
    p.add_argument("--gap", type=float, default=6.0, help="CPW gap, um")
    p.add_argument("--gui", action="store_true", help="open the qiskit-metal GUI")
    p.add_argument("--out", type=Path, default=OUTPUT, help="output directory")
    args = p.parse_args()

    design, info = build_design(args.freq, args.width, args.gap)
    for key, val in info.items():
        print(f"{key:>24}: {val:.4g}")

    if args.gui:
        from qiskit_metal import MetalGUI

        MetalGUI(design).main_window.show()  # blocks via Qt event loop
        return
    print("GDS:    ", export_gds(design, args.out / "resonator.gds"))
    print("Preview:", save_preview(design, args.out / "resonator.png"))


if __name__ == "__main__":
    main()
