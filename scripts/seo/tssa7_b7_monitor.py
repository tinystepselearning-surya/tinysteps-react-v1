#!/usr/bin/env python3
"""B7 evidence monitor. Reads the existing tracker; never mutates sites or source data."""
import argparse
import csv
import json
from datetime import datetime, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

IST = ZoneInfo("Asia/Kolkata")
STATES = {"NOT_CHECKED", "PASS", "WARN", "FAIL", "UNVERIFIED"}
PROVIDERS = ["ChatGPT Search", "Gemini", "Google AI Mode", "Bing/Copilot"]


def require(ok, msg):
    if not ok:
        raise ValueError("B7 evidence integrity: " + msg)


def summarize(rows, native, now, marker, branch="seo-url-health-tracker"):
    require(len(rows) == 202, "exactly 202 tracked public URLs required")
    require(len({r["url"] for r in rows}) == 202, "duplicate URL")
    require(len({r["index"] for r in rows}) == 202, "duplicate index")
    require(all(r["url"].startswith("https://tinystepslearning.com/") for r in rows), "external origin")
    require(all(r["today_status"] in STATES for r in rows), "invalid status")
    require(native["project"] == "TSSA-7/B6" and native["source_count"] == 48,
            "native source mismatch")
    require(native["new_native_sessions_in_this_brick"] == 0 and
            native["current_cross_provider_citation_rate"] is None, "unverified AI claim")
    providers = native["target_platforms"]
    require([p["platform"] for p in providers] == PROVIDERS, "provider drift")
    require(providers[3]["historical_completed"] == 0, "unverified Bing native success")
    local = now.astimezone(IST)
    day = local.date().isoformat()
    observed = [r for r in rows if r["today_ist"] == day and
                r["today_status"] != "NOT_CHECKED" and r["checked_at_utc"]]
    times = []
    for row in observed:
        try:
            ts = datetime.fromisoformat(row["checked_at_utc"].replace("Z", "+00:00"))
            require(ts.tzinfo is not None and ts <= now and ts.astimezone(IST).date() == local.date(),
                    "invalid current observation timestamp")
            times.append(ts)
        except (TypeError, ValueError) as exc:
            raise ValueError("B7 invalid observation time for " + row["url"]) from exc
    counts = {s: sum(r["today_status"] == s for r in observed)
              for s in ("PASS", "WARN", "FAIL", "UNVERIFIED")}
    pending = [r for r in rows if r not in observed]
    failures = [r for r in observed if r["today_status"] == "FAIL"]
    unknowns = [r for r in observed if r["today_status"] == "UNVERIFIED"]
    warnings = [r for r in observed if r["today_status"] == "WARN"]
    last = max(times) if times else None
    stale_hours = round((now - last).total_seconds() / 3600, 2) if last else None
    after_deadline = local.hour >= 21
    gap = after_deadline and bool(pending)
    stale = last is None or stale_hours > 3
    alerts = (["Confirmed technical FAIL in today's recorded observations"] if failures else []) + (
        ["Missing daily 202-URL coverage after 21:00 IST"] if gap else []) + (
        ["Missing/stale monitoring samples after 21:00 IST"] if after_deadline and stale else [])
    state = ("SITE_TECHNICAL_FAILURE" if failures else
             "MONITOR_COVERAGE_GAP" if gap else
             "OBSERVATION_UNVERIFIED" if unknowns else
             "OBSERVATION_WARN" if warnings else
             "MONITOR_STALE" if stale else
             "PARTIAL_DAILY_COVERAGE" if pending else "OBSERVED_TECHNICAL_PASS")
    return {
        "project": "TSSA-7/B7",
        "observed_at_utc": now.astimezone(timezone.utc).isoformat(timespec="seconds"),
        "day_ist": day, "verdict": state, "alert_needed": bool(alerts), "alert_reasons": alerts,
        "coverage": {"tracked": 202, "observed_today": len(observed),
                     "unobserved_today": len(pending),
                     "coverage_percent": round(len(observed) * 100 / 202, 2),
                     "statuses": counts,
                     "last_checked_at_utc": last.isoformat() if last else None,
                     "hours_since_last_check": stale_hours,
                     "completion_deadline_reached": after_deadline},
        "failures": [r["url"] + ": " + r.get("reason", "") for r in failures[:25]],
        "unverified": [r["url"] + ": " + r.get("reason", "") for r in unknowns[:25]],
        "warnings": [r["url"] + ": " + r.get("reason", "") for r in warnings[:25]],
        "unchecked_sample": [r["url"] for r in pending[:25]],
        "production": {
            "hosting_marker_sha": marker, "tracker_branch": branch,
            "evidence_scope": "Historical verified release marker, not live build revalidation or a deployment"
        },
        "native": {
            "historical_answers_2026_10_19": native["historical_completed_answers"],
            "new_provider_native_answers": 0, "bing_completed": 0,
            "current_citation_rate": None, "scope": "No AI provider native sessions conducted by this workflow"
        },
        "caveats": [
            "Recorded technical PASS is neither indexed-state, search rank nor AI citation proof.",
            "GitHub scheduled workflows may be delayed/skipped; unchecked rows never count as PASS.",
            "UNVERIFIED observations represent uncertainty, not verified website failures.",
            "This B7 job is source/evidence aggregation. Actual HTTP checks remain in the hourly workflow."
        ]
    }


def markdown(r, upstream):
    c = r["coverage"]
    lines = [
        "# TSSA-7/B7 — Search monitoring evidence",
        "",
        "Date IST: " + r["day_ist"] + " | Report UTC: " + r["observed_at_utc"],
        "",
        "**Verdict:** " + r["verdict"],
        "**Observed today:** " + str(c["observed_today"]) + "/202; **unchecked:** " + str(c["unobserved_today"]),
        "**Actual observed statuses:** " + json.dumps(c["statuses"]),
        "**Last actual check:** " + str(c["last_checked_at_utc"]) + "; hours stale: " + str(c["hours_since_last_check"]),
        "**Production marker (not live revalidation):** " + r["production"]["hosting_marker_sha"],
        "**Native AI evidence:** 36 historical answers from Oct 19; no fresh session; Bing 12 untested, not zero citations.",
        "",
        "## Operational alert",
        "",
        "**Alert:** " + str(r["alert_needed"]) + "; " + ("; ".join(r["alert_reasons"]) or "No confirmed late gap or site failure"),
        "",
        "## Today's recorded site failures",
        *(("- " + x for x in r["failures"]) if r["failures"] else ["- None among observed URLs"]),
        "",
        "## Today's unverified observations",
        *(("- " + x for x in r["unverified"]) if r["unverified"] else ["- None among observed URLs"]),
        "",
        "## Unchecked sample",
        *(("- " + x for x in r["unchecked_sample"]) if r["unchecked_sample"] else ["- None"]),
        "",
        "## Existing hourly tracker snapshot (excerpt)",
        "", upstream[:1600], "",
        "## Evidence limits",
        *("- " + x for x in r["caveats"]),
        "",
        "Operational exceptions: https://github.com/tinystepselearning-surya/tinysteps-react-v1/issues/772",
        ""
    ]
    return "\n".join(lines)


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--tracker", required=True)
    p.add_argument("--native-summary", required=True)
    p.add_argument("--source-summary", required=True)
    p.add_argument("--out-dir", required=True)
    p.add_argument("--hosting-marker", required=True)
    p.add_argument("--now", help="ISO timestamp for regression tests")
    a = p.parse_args()
    now = datetime.fromisoformat(a.now.replace("Z", "+00:00")) if a.now else datetime.now(timezone.utc)
    require(now.tzinfo is not None, "timestamp lacks timezone")
    with open(a.tracker, encoding="utf-8", newline="") as stream:
        rows = list(csv.DictReader(stream))
    native = json.loads(Path(a.native_summary).read_text(encoding="utf-8"))
    report = summarize(rows, native, now, a.hosting_marker)
    dest = Path(a.out_dir)
    dest.mkdir(parents=True, exist_ok=True)
    (dest / "B7_STATUS.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    (dest / "B7_STATUS.md").write_text(markdown(report,
        Path(a.source_summary).read_text(encoding="utf-8")), encoding="utf-8")
    print("TSSA7_B7_STATUS " + json.dumps({
        "verdict": report["verdict"], "checked": report["coverage"]["observed_today"],
        "pending": report["coverage"]["unobserved_today"], "alert": report["alert_needed"]}))


if __name__ == "__main__":
    main()
