import math
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from analysis import CPW, quarter_wave_frequency, quarter_wave_length  # noqa: E402

CPW_10_6 = CPW(width=10e-6, gap=6e-6)


def test_standard_cpw_is_about_50_ohm():
    assert math.isclose(CPW_10_6.impedance, 50.0, rel_tol=0.05)


def test_length_frequency_round_trip():
    f = 6.5e9
    assert math.isclose(quarter_wave_frequency(quarter_wave_length(f, CPW_10_6), CPW_10_6), f)


def test_quarter_wave_length_6p5ghz_silicon():
    # v = c / sqrt(6.225) ~ 1.2e8 m/s  ->  l ~ 4.6 mm
    assert math.isclose(quarter_wave_length(6.5e9, CPW_10_6), 4.62e-3, rel_tol=0.01)
