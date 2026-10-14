"""Analytic CPW resonator estimates (no qiskit-metal needed).

Conformal-mapping results for a coplanar waveguide on a thick substrate
(Simons, "Coplanar Waveguide Circuits, Components, and Systems"). Kinetic
inductance and finite metal thickness are ignored, so treat results as a
starting point for the layout, then refine with HFSS/Q3D/Sonnet.
"""
from __future__ import annotations

from dataclasses import dataclass

import numpy as np
from scipy.special import ellipk

C0 = 299_792_458.0  # m/s
EPS_SILICON = 11.45  # relative permittivity of Si at cryogenic temperature


@dataclass(frozen=True)
class CPW:
    """CPW cross-section. Lengths in metres."""

    width: float  # centre-conductor width, w
    gap: float  # gap to ground, s
    eps_r: float = EPS_SILICON

    @property
    def eps_eff(self) -> float:
        # Thick-substrate limit: half the field is in vacuum, half in substrate.
        return (1.0 + self.eps_r) / 2.0

    @property
    def phase_velocity(self) -> float:
        return C0 / np.sqrt(self.eps_eff)

    @property
    def impedance(self) -> float:
        k = self.width / (self.width + 2.0 * self.gap)
        # scipy's ellipk takes the parameter m = k**2, not the modulus k.
        ratio = ellipk(1.0 - k**2) / ellipk(k**2)
        return 30.0 * np.pi / np.sqrt(self.eps_eff) * ratio


def quarter_wave_length(freq_hz: float, cpw: CPW) -> float:
    """Physical length (m) of a lambda/4 resonator at ``freq_hz``."""
    return cpw.phase_velocity / (4.0 * freq_hz)


def quarter_wave_frequency(length_m: float, cpw: CPW) -> float:
    """Fundamental frequency (Hz) of a lambda/4 resonator of ``length_m``."""
    return cpw.phase_velocity / (4.0 * length_m)


def lumped_lc(freq_hz: float, length_m: float, cpw: CPW) -> tuple[float, float]:
    """Equivalent parallel-LC values (L in H, C in F) of a lambda/4 resonator."""
    z0 = cpw.impedance
    c_per_len = 1.0 / (cpw.phase_velocity * z0)
    c_eq = c_per_len * length_m / 2.0
    l_eq = 1.0 / ((2.0 * np.pi * freq_hz) ** 2 * c_eq)
    return l_eq, c_eq
