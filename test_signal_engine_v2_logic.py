import unittest
from datetime import datetime, timezone
from unittest.mock import patch

import pandas as pd

from signal_engine_v2 import (
    DEMO_TP1_CLOSE_FRACTION,
    _runtime_event_write_warning,
    check_engine_runtime_health,
    compute_signal_realized_r,
    fetch_candles,
    get_required_score_threshold,
    get_signal_expiry_hours,
    get_session_threshold_adjustment,
    partition_active_signals,
    required_entry_confirmation,
    resample_candles,
    session_allows_new_entries,
    should_run_signal_generation,
)


class SignalEngineV2LogicTests(unittest.TestCase):
    def test_session_allows_asia_london_and_overlap(self) -> None:
        self.assertTrue(session_allows_new_entries("LONDON"))
        self.assertTrue(session_allows_new_entries("LONDON_NY_OVERLAP"))
        self.assertTrue(session_allows_new_entries("ASIA"))
        self.assertFalse(session_allows_new_entries("NEW_YORK"))

    def test_asia_threshold_adjustment_is_higher_than_london(self) -> None:
        self.assertEqual(get_session_threshold_adjustment("ASIA"), 8)
        self.assertEqual(get_session_threshold_adjustment("LONDON"), 0)
        self.assertEqual(get_session_threshold_adjustment("UNKNOWN"), 0)

    def test_same_score_can_pass_london_but_fail_asia(self) -> None:
        score = 80.0
        base_threshold = 76.0
        self.assertGreaterEqual(score, get_required_score_threshold(base_threshold, "LONDON"))
        self.assertLess(score, get_required_score_threshold(base_threshold, "ASIA"))

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

    def test_runtime_write_warning_mentions_service_role_for_rls_errors(self) -> None:
        warning = _runtime_event_write_warning(Exception("42501 new row violates row-level security policy"))
        self.assertIn("service-role key", warning)
        self.assertIn("runtime health alerts are disabled", warning)

    def test_engine_outage_alerts_are_skipped_when_runtime_logging_is_unavailable(self) -> None:
        with patch("signal_engine_v2.RUNTIME_EVENT_WRITES_AVAILABLE", False):
            with patch("signal_engine_v2._latest_completed_decision_run") as latest_run:
                with patch("signal_engine_v2.send_operational_alert") as send_alert:
                    latest_run.return_value = {"created_at": "2026-04-22T00:00:00+00:00"}
                    check_engine_runtime_health(
                        {"provider_ts": "2026-04-22T01:00:00+00:00"},
                        {"market_open": True},
                    )
                    send_alert.assert_not_called()

    def test_engine_outage_alerts_are_skipped_when_recent_rate_limit_was_recorded(self) -> None:
        with patch("signal_engine_v2._recent_runtime_stage_exists", return_value=True):
            with patch("signal_engine_v2._latest_completed_decision_run") as latest_run:
                with patch("signal_engine_v2.send_operational_alert") as send_alert:
                    check_engine_runtime_health(
                        {"provider_ts": "2026-04-22T01:00:00+00:00"},
                        {"market_open": True},
                    )
                    latest_run.assert_not_called()
                    send_alert.assert_not_called()

    def test_fetch_candles_classifies_rate_limit_errors(self) -> None:
        response = unittest.mock.Mock()
        response.raise_for_status.return_value = None
        response.json.return_value = {
            "status": "error",
            "code": 429,
            "message": "quota exceeded",
        }
        with patch("signal_engine_v2.HTTP.get", return_value=response):
            result = fetch_candles("XAU/USD", 15, "minute")
        self.assertFalse(result.ok)
        self.assertEqual(result.status, "RATE_LIMITED")
        self.assertEqual(result.code, 429)
        self.assertEqual(result.interval, "15min")

    def test_should_run_signal_generation_only_on_15m_boundary(self) -> None:
        self.assertTrue(should_run_signal_generation(datetime(2026, 4, 23, 8, 15, tzinfo=timezone.utc)))
        self.assertTrue(should_run_signal_generation(datetime(2026, 4, 23, 8, 30, tzinfo=timezone.utc)))
        self.assertFalse(should_run_signal_generation(datetime(2026, 4, 23, 8, 12, tzinfo=timezone.utc)))

    def test_resample_candles_derives_hourly_and_4h_frames(self) -> None:
        index = pd.date_range("2026-04-23T00:00:00Z", periods=32, freq="15min")
        source = pd.DataFrame(
            {
                "Open": range(32),
                "High": [v + 1 for v in range(32)],
                "Low": [v - 1 for v in range(32)],
                "Close": [v + 0.5 for v in range(32)],
                "Volume": [10] * 32,
            },
            index=index,
        )

        h1 = resample_candles(source, "1h", bars=10)
        h4 = resample_candles(source, "4h", bars=10)

        self.assertEqual(len(h1), 8)
        self.assertEqual(len(h4), 2)
        self.assertEqual(h1.iloc[0]["Open"], 0)
        self.assertEqual(h1.iloc[0]["Close"], 3.5)
        self.assertEqual(h4.iloc[0]["Open"], 0)
        self.assertEqual(h4.iloc[0]["Close"], 15.5)
        self.assertEqual(h4.iloc[0]["Volume"], 160)


if __name__ == "__main__":
    unittest.main()
