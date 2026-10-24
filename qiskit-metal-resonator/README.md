# Qiskit Metal: quarter-wave CPW resonator

A superconducting readout resonator (lambda/4 coplanar waveguide) capacitively
coupled to a feedline, laid out with [Qiskit Metal](https://qiskit-community.github.io/qiskit-metal/).
The resonator length is computed from a target frequency, so changing the frequency re-generates the layout.

```
qiskit-metal-resonator/
├── environment.yml     conda env with the version pins qiskit-metal needs
├── src/
│   ├── analysis.py     analytic CPW model: impedance, eps_eff, lambda/4 length <-> frequency, lumped LC
│   └── resonator.py    builds the layout, exports GDS + a PNG preview (or opens the GUI)
├── tests/              pytest checks for analysis.py
└── output/             generated resonator.gds / resonator.png (git-ignored)
```

## Run

```bash
conda env create -f environment.yml && conda activate qmetal
python src/resonator.py --freq 6.5          # writes output/resonator.gds and .png
python src/resonator.py --freq 7.0 --gui    # interactive Qt GUI (needs a display)
pytest tests
```

Defaults: 6.5 GHz, 10 um centre conductor / 6 um gap (~51 ohm on silicon), 9 x 6 mm chip.

## How the length is chosen

`eps_eff = (1 + eps_r)/2` (thick silicon substrate, eps_r = 11.45), so `v = c/sqrt(eps_eff)` and
`l = v / (4 f)`, about 4.62 mm at 6.5 GHz. The coupler tee's own arm is subtracted from the
meander length. The routed length is printed as `routed_meander_um`.

## Limits of this model

The estimate ignores kinetic inductance, metal thickness and the loading from the coupler and
the open end, so the real frequency will sit a little below the target. Verify and tune with an
eigenmode simulation (Ansys HFSS through `qiskit_metal.analyses`) or a Sonnet sweep before fabrication.

## Next steps

- Add a transmon (e.g. `TransmonPocket`) coupled to the open end and run LOM/EPR analysis.
- Add several resonators on one feedline with staggered frequencies.
