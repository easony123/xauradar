import unittest

from signal_engine_v2 import (
    DEMO_TP1_CLOSE_FRACTION,
    compute_signal_realized_r,
    get_signal_expiry_hours,
    partition_active_signals,
    required_entry_confirmation,
    session_allows_new_entries,
)


class SignalEngineV2LogicTests(unittest.TestCase):
    def test_session_allows_only_london_and_overlap(self) -> None:
        self.assertTrue(session_allows_new_entries("LONDON"))
        self.assertTrue(session_allows_new_entries("LONDON_NY_OVERLAP"))
        self.assertFalse(session_allows_new_entries("ASIA"))
        self.assertFalse(session_allows_new_entries("NEW_YORK"))

    def test_intraday_confirmation_requires_momentum(self) -> None:
        ok, reason = required_entry_confirmation(
            "intraday",
            trend_filter=True,
            momentum=False,
            pullback=True,
            session_fit=True,
        )
        self.assertFalse(ok)
        self.assertEqual(reason, "INTRADAY_CONFIRMATION_MISSING")

    def test_swing_confirmation_requires_trend_session_and_signal(self) -> None:
        ok, reason = required_entry_confirmation(
            "swing",
            trend_filter=True,
            momentum=False,
            pullback=False,
            session_fit=True,
        )
        self.assertFalse(ok)
        self.assertEqual(reason, "SWING_CONFIRMATION_MISSING")

    def test_lane_specific_expiry_hours(self) -> None:
        self.assertEqual(get_signal_expiry_hours({"lane": "intraday"}), 6)
        self.assertEqual(get_signal_expiry_hours({"lane": "swing"}), 18)

    def test_partial_tp_then_breakeven_realized_r_is_positive(self) -> None:
        signal_row = {
            "type": "BUY",
            "entry_price": 100.0,
            "sl": 100.0,
            "tp1": 110.0,
            "tp2": 120.0,
            "rr_value": 2.0,
        }
        conditions = {
            "tp1_be_applied": True,
            "tp1_hit_at": "2026-04-20T12:24:00+00:00",
            "tp1_fraction": DEMO_TP1_CLOSE_FRACTION,
            "orig_sl": 90.0,
        }
        self.assertAlmostEqual(compute_signal_realized_r(signal_row, 100.0, conditions), 0.4, places=6)

    def test_partial_tp_then_tp2_realized_r_reflects_partial_scaling(self) -> None:
        signal_row = {
            "type": "BUY",
            "entry_price": 100.0,
            "sl": 100.0,
            "tp1": 110.0,
            "tp2": 120.0,
            "rr_value": 2.0,
        }
        conditions = {
            "tp1_be_applied": True,
            "tp1_hit_at": "2026-04-20T12:24:00+00:00",
            "tp1_fraction": DEMO_TP1_CLOSE_FRACTION,
            "orig_sl": 90.0,
        }
        self.assertAlmostEqual(compute_signal_realized_r(signal_row, 120.0, conditions), 1.6, places=6)

    def test_partition_active_signals_keeps_newest_per_lane(self) -> None:
        active_rows = [
            {"id": "newest-intraday", "lane": "intraday"},
            {"id": "older-intraday", "lane": "intraday"},
            {"id": "swing-keeper", "lane": "swing"},
        ]
        active_by_lane, duplicates = partition_active_signals(active_rows)
        self.assertEqual(active_by_lane["intraday"]["id"], "newest-intraday")
        self.assertEqual(active_by_lane["swing"]["id"], "swing-keeper")
        self.assertEqual([row["id"] for row in duplicates], ["older-intraday"])


if __name__ == "__main__":
    unittest.main()
