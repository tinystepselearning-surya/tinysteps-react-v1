#!/usr/bin/env python3
"""Deterministic B7 guards. No external URLs or GitHub state required."""
import copy
import unittest
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

from tssa7_b7_monitor import summarize

IST = ZoneInfo("Asia/Kolkata")
NOW = datetime(2026, 10, 25, 16, 5, tzinfo=timezone.utc)  # 21:35 IST
MORNING = datetime(2026, 10, 25, 2, 45, tzinfo=timezone.utc)  # 08:15 IST
OWNER = "https://tinystepslearning.com/"


def fixtures():
    rows = [{
        "index": str(n), "url": OWNER + ("resource-" + str(n) if n > 1 else ""),
        "today_ist": "", "today_status": "NOT_CHECKED", "checked_at_utc": "",
        "reason": ""
    } for n in range(1, 203)]
    native = {
        "project": "TSSA-7/B6", "source_count": 48,
        "new_native_sessions_in_this_brick": 0,
        "current_cross_provider_citation_rate": None,
        "historical_completed_answers": 36,
        "target_platforms": [
            {"platform": n, "historical_completed": 12 if n != "Bing/Copilot" else 0}
            for n in ("ChatGPT Search", "Gemini", "Google AI Mode", "Bing/Copilot")
        ]
    }
    return rows, native


def observed(row, instant, state="PASS"):
    row["today_ist"] = instant.astimezone(IST).date().isoformat()
    row["today_status"] = state
    row["checked_at_utc"] = instant.isoformat()
    row["reason"] = "Test observation"


class MonitoringGuards(unittest.TestCase):
    def test_evening_gap_alert_distinct_from_website_failure(self):
        rows, native = fixtures()
        for row in rows[:20]:
            observed(row, NOW - timedelta(hours=1))
        report = summarize(rows, native, NOW, "marker")
        self.assertTrue(report["alert_needed"])
        self.assertEqual(report["verdict"], "MONITOR_COVERAGE_GAP")
        self.assertEqual(report["coverage"]["observed_today"], 20)
        self.assertEqual(report["coverage"]["unobserved_today"], 182)
        self.assertEqual(report["coverage"]["statuses"]["FAIL"], 0)
        self.assertEqual(report["native"]["current_citation_rate"], None)

    def test_morning_incomplete_coverage_is_not_late_alert(self):
        rows, native = fixtures()
        for row in rows[:20]:
            observed(row, MORNING - timedelta(minutes=15))
        report = summarize(rows, native, MORNING, "marker")
        self.assertFalse(report["alert_needed"])
        self.assertEqual(report["verdict"], "PARTIAL_DAILY_COVERAGE")

    def test_actual_site_fail_triggers_alert_regardless_of_hour(self):
        rows, native = fixtures()
        observed(rows[0], MORNING - timedelta(minutes=5), "FAIL")
        report = summarize(rows, native, MORNING, "marker")
        self.assertTrue(report["alert_needed"])
        self.assertEqual(report["verdict"], "SITE_TECHNICAL_FAILURE")
        self.assertEqual(len(report["failures"]), 1)

    def test_unverified_does_not_invent_site_failure(self):
        rows, native = fixtures()
        for row in rows:
            observed(row, NOW - timedelta(minutes=40))
        observed(rows[4], NOW - timedelta(minutes=30), "UNVERIFIED")
        report = summarize(rows, native, NOW, "marker")
        self.assertFalse(report["alert_needed"])
        self.assertEqual(report["verdict"], "OBSERVATION_UNVERIFIED")
        self.assertEqual(report["coverage"]["statuses"]["FAIL"], 0)
        self.assertEqual(report["coverage"]["observed_today"], 202)

    def test_stale_health_snapshot_is_alert_after_deadline(self):
        rows, native = fixtures()
        for row in rows:
            observed(row, NOW - timedelta(hours=4))
        report = summarize(rows, native, NOW, "marker")
        self.assertTrue(report["alert_needed"])
        self.assertIn("stale", " ".join(report["alert_reasons"]).lower())
        self.assertEqual(report["coverage"]["observed_today"], 202)

    def test_reject_duplicate_owners_and_unfounded_bing_success(self):
        rows, native = fixtures()
        rows[1]["url"] = rows[0]["url"]
        with self.assertRaisesRegex(ValueError, "duplicate URL"):
            summarize(rows, native, NOW, "marker")
        rows, native = fixtures()
        native["target_platforms"][3]["historical_completed"] = 12
        with self.assertRaisesRegex(ValueError, "Bing native"):
            summarize(rows, native, NOW, "marker")
        rows, native = fixtures()
        observed(rows[0], NOW + timedelta(hours=1))
        with self.assertRaisesRegex(ValueError, "invalid observation"):
            summarize(rows, native, NOW, "marker")

    def test_previous_day_pass_is_not_counted_today(self):
        rows, native = fixtures()
        observed(rows[0], NOW - timedelta(days=1))
        observed(rows[1], NOW - timedelta(minutes=2))
        report = summarize(rows, native, NOW, "marker")
        self.assertEqual(report["coverage"]["observed_today"], 1)
        self.assertEqual(report["coverage"]["statuses"]["PASS"], 1)


if __name__ == "__main__":
    unittest.main()
