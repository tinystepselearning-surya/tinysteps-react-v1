#!/usr/bin/env python3
"""Read-only hourly public SEO/AEO/GEO readiness audit. Standard library only."""
import argparse
import csv
import io
import json
import re
import sys
import time
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlparse
from urllib.request import Request, urlopen
from urllib.robotparser import RobotFileParser
from xml.etree import ElementTree
from zoneinfo import ZoneInfo

ORIGIN = "https://tinystepslearning.com"
SITEMAPS = ("sitemap-static.xml", "sitemap-blog.xml", "sitemap-courses.xml", "sitemap-parents.xml")
EXCLUDE = {"/learning-partner", "/parents/scheduling", "/parents/payments"}
BOTS = ("Googlebot", "Bingbot", "OAI-SearchBot")
UA = "TinyStepsPublicSEOHealth/1.0 (+https://tinystepslearning.com/)"
LOCAL = ZoneInfo("Asia/Kolkata")
VALID = {"PASS", "WARN", "FAIL"}
HEADINGS = ("index", "slot", "category", "source_sitemap", "url", "priority",
            "today_ist", "today_status", "checked_at_utc", "http_status", "final_url",
            "canonical", "indexing_directive", "googlebot_robots",
            "bingbot_robots", "oai_searchbot_robots", "html_content", "jsonld",
            "reason", "evidence", "last_verified_status", "last_verified_at_utc")


def get(url, attempts=1):
    """Return real response status/body, or None on transport/tool failure."""
    error = ""
    for trial in range(attempts):
        try:
            req = Request(url, headers={"User-Agent": UA, "Accept": "text/html, application/xml, text/plain, */*"})
            with urlopen(req, timeout=14) as response:
                return {"status": response.status, "url": response.url,
                        "headers": dict(response.headers.items()),
                        "body": response.read(1_500_000).decode("utf-8", "replace")}
        except HTTPError as exc:
            error = str(exc)
            if trial + 1 == attempts:
                return {"status": exc.code, "url": exc.geturl(), "headers": dict(exc.headers.items()),
                        "body": exc.read(500_000).decode("utf-8", "replace")}
        except (URLError, TimeoutError, OSError, ValueError) as exc:
            error = f"{type(exc).__name__}: {exc}"
        if trial + 1 < attempts:
            time.sleep(1)
    return {"status": None, "url": url, "headers": {}, "body": "", "error": error}


def normalized(value):
    return value.rstrip("/") or "/"


def field(headers, name):
    return next((str(v) for k, v in headers.items() if k.lower() == name.lower()), "")


class PageReader(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.title, self.h1, self.description, self.robots_meta = "", "", "", ""
        self.canonical, self.text, self.json_scripts = "", [], []
        self._title = self._h1 = self._body = False
        self._skip = 0
        self._json = False
        self._json_buffer = []

    def handle_starttag(self, tag, attrs):
        a = {k.lower(): (v or "") for k, v in attrs}
        if tag == "title":
            self._title = True
        if tag == "h1":
            self._h1 = True
        if tag == "body":
            self._body = True
        if tag == "script" and a.get("type", "").lower() == "application/ld+json":
            self._json, self._json_buffer = True, []
        elif tag in ("script", "style", "svg"):
            self._skip += 1
        if tag == "meta":
            name = a.get("name", "").lower()
            if name == "description":
                self.description = a.get("content", "")
            if name in ("robots", "googlebot", "bingbot"):
                self.robots_meta += " " + a.get("content", "")
        if tag == "link" and "canonical" in a.get("rel", "").lower().split():
            self.canonical = a.get("href", "")

    def handle_endtag(self, tag):
        if tag == "title":
            self._title = False
        if tag == "h1":
            self._h1 = False
        if tag == "body":
            self._body = False
        if tag == "script" and self._json:
            self.json_scripts.append("".join(self._json_buffer))
            self._json = False
        elif tag in ("script", "style", "svg") and self._skip:
            self._skip -= 1

    def handle_data(self, data):
        if self._json:
            self._json_buffer.append(data)
            return
        if self._skip:
            return
        if self._title:
            self.title += data
        if self._h1:
            self.h1 += data
        if self._body:
            self.text.append(data)


def get_discovery():
    robots = get(ORIGIN + "/robots.txt", 2)
    rp = None
    if robots["status"] == 200:
        rp = RobotFileParser()
        rp.parse(robots["body"].splitlines())
    idx = get(ORIGIN + "/sitemap.xml", 2)
    locations = set()
    sitemap_ok = idx["status"] == 200
    sitemap_notes = []
    if sitemap_ok:
        try:
            root = ElementTree.fromstring(idx["body"])
            children = [e.text.strip() for e in root.iter() if e.tag.rsplit("}", 1)[-1] == "loc" and e.text]
            if not children:
                sitemap_ok = False
                sitemap_notes.append("Live sitemap index contains no child sitemap URLs")
            for child in children:
                if urlparse(child).netloc != "tinystepslearning.com":
                    sitemap_ok = False
                    sitemap_notes.append("External child sitemap " + child)
                    continue
                response = get(child, 2)
                if response["status"] != 200:
                    sitemap_ok = False
                    sitemap_notes.append(f"Child sitemap unavailable {child}: HTTP {response['status']}")
                    continue
                try:
                    sub = ElementTree.fromstring(response["body"])
                    locations.update(e.text.strip() for e in sub.iter()
                                     if e.tag.rsplit("}", 1)[-1] == "loc" and e.text)
                except ElementTree.ParseError:
                    sitemap_ok = False
                    sitemap_notes.append("Invalid child XML: " + child)
        except ElementTree.ParseError:
            sitemap_ok = False
            sitemap_notes.append("Live sitemap index is not valid XML")
    else:
        sitemap_notes.append(f"Cannot verify live sitemap HTTP {idx['status']}")
    return rp, robots, (locations if sitemap_ok else None), sitemap_notes


def check_page(url, rp, robots, sitemap_urls, sitemap_notes, now):
    fields = {name: "" for name in HEADINGS}
    fields["url"] = url
    fields["checked_at_utc"] = now.astimezone(timezone.utc).isoformat(timespec="seconds")
    fields["today_ist"] = now.date().isoformat()
    issues, critical, unknown = [], [], []
    response = get(url, 2)
    status, final_url = response["status"], response["url"]
    fields["http_status"] = status if status is not None else ""
    fields["final_url"] = final_url
    fields["evidence"] = f"GET {url}; UTC {fields['checked_at_utc']}; HTTP {status}; final {final_url}"
    if status is None:
        unknown.append("Origin HTTP not retrievable: " + response.get("error", "unknown"))
    elif status != 200:
        critical.append(f"HTTP {status}")
    if final_url != url:
        issues.append("URL redirects or normalizes to " + final_url)
        if urlparse(final_url).netloc != "tinystepslearning.com":
            critical.append("Redirect outside canonical domain")
    if rp is None:
        unknown.append(f"Could not verify live robots.txt (HTTP {robots['status']})")
    for bot, name in zip(BOTS, ("googlebot_robots", "bingbot_robots", "oai_searchbot_robots")):
        if rp is None:
            fields[name] = "UNVERIFIED"
        else:
            allowed = rp.can_fetch(bot, url)
            fields[name] = "ALLOW" if allowed else "DISALLOW"
            if not allowed:
                critical.append(f"robots.txt disallows {bot}")
    if sitemap_urls is None:
        unknown.append("; ".join(sitemap_notes) or "Live XML sitemap unavailable")
    elif url not in sitemap_urls:
        issues.append("Not present in retrieved live XML sitemaps")
    if status == 200:
        parser = PageReader()
        try:
            parser.feed(response["body"])
        except Exception as exc:
            unknown.append("HTML parser could not inspect document: " + str(exc))
        else:
            fields["canonical"] = parser.canonical
            robots_header = field(response["headers"], "X-Robots-Tag")
            directives = (parser.robots_meta + " " + robots_header).strip()
            fields["indexing_directive"] = directives or "none observed"
            if re.search(r"\bnoindex\b", directives, flags=re.I):
                critical.append("Public landing page carries noindex directive")
            if not parser.canonical:
                issues.append("No canonical in initial response HTML")
            elif not parser.canonical.startswith(ORIGIN + "/"):
                critical.append("Canonical points outside preferred https origin")
            elif normalized(parser.canonical) != normalized(url):
                issues.append("Non-self canonical: " + parser.canonical)
            if not parser.title.strip():
                issues.append("No title in initial response HTML")
            if not parser.description.strip():
                issues.append("No meta description in initial response HTML")
            if not parser.h1.strip():
                issues.append("No H1 in initial response HTML")
            visible_len = len(re.sub(r"\s+", " ", " ".join(parser.text)).strip())
            fields["html_content"] = f"{visible_len} visible initial-HTML characters"
            if visible_len < 120:
                issues.append("Initial HTML text appears thin; JS-rendered crawl still unverified")
            invalid_json = 0
            for script in parser.json_scripts:
                try:
                    json.loads(script)
                except json.JSONDecodeError:
                    invalid_json += 1
            fields["jsonld"] = (f"INVALID ({invalid_json}/{len(parser.json_scripts)})" if invalid_json
                                else f"VALID ({len(parser.json_scripts)})" if parser.json_scripts else "ABSENT")
            if invalid_json:
                issues.append("Malformed JSON-LD in initial HTML")
            # Schema absence is not by itself a violation of Google technical requirements.
    if critical:
        fields["today_status"] = "FAIL"
    elif unknown:
        fields["today_status"] = "UNVERIFIED"
    elif issues:
        fields["today_status"] = "WARN"
    else:
        fields["today_status"] = "PASS"
    fields["reason"] = "; ".join(critical + unknown + issues) or "Observable readiness checks passed; indexing and AI citation not assessed"
    return fields


def source_drift(rows):
    from_source = []
    issues = []
    for name in SITEMAPS:
        path = Path("public") / name
        if not path.exists():
            issues.append("Source sitemap missing: " + str(path))
            continue
        try:
            root = ElementTree.parse(path).getroot()
            from_source += [e.text.strip() for e in root.iter()
                            if e.tag.rsplit("}", 1)[-1] == "loc" and e.text
                            and urlparse(e.text.strip()).path not in EXCLUDE]
        except ElementTree.ParseError:
            issues.append("Source sitemap XML invalid: " + str(path))
    listed = [r["url"] for r in rows]
    added = sorted(set(from_source) - set(listed))
    removed = sorted(set(listed) - set(from_source))
    if added or removed:
        issues.append(f"Scope drift: {len(added)} new / {len(removed)} missing URLs in current main sitemaps")
    if len(from_source) != 202:
        issues.append(f"Main sitemap selected count is {len(from_source)}; fixed tracking baseline remains 202")
    return issues, added, removed


def read_text(path):
    return Path(path).read_text(encoding="utf-8") if Path(path).exists() else ""


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--tracker", required=True)
    p.add_argument("--changes", required=True)
    p.add_argument("--out-dir", required=True)
    p.add_argument("--slot", type=int, choices=range(1, 25), help="Explicit slot for local tests")
    p.add_argument("--dry-run", action="store_true", help="Avoid all website requests; validate selection only")
    a = p.parse_args()
    now = datetime.now(LOCAL)
    slot = a.slot or now.hour + 1
    with open(a.tracker, newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    if len(rows) != 202 or len({r["url"] for r in rows}) != 202:
        raise SystemExit("Aborting: expected exactly 202 unique tracked URLs")
    if any(set(HEADINGS) - set(r) for r in rows):
        raise SystemExit("Aborting: master tracker lacks required columns")
    if slot <= 19:
        selected = rows[(slot-1)*10:slot*10]
    elif slot == 20:
        selected = rows[190:]
    elif slot in (23, 24):
        selected = [r for r in rows if r.get("today_ist") != now.date().isoformat()
                    or r.get("today_status") in ("NOT_CHECKED", "UNVERIFIED")][:10]
    else:
        selected = []
    print(f"Slot {slot}; selected {len(selected)} URLs; local date {now.date()}")
    changes = read_text(a.changes)
    found_events = []
    if selected and not a.dry_run:
        robots, robots_response, sitemap_urls, sitemap_notes = get_discovery()
        for row in selected:
            before = row.copy()
            observed = check_page(row["url"], robots, robots_response, sitemap_urls, sitemap_notes, now)
            previous_status = before.get("today_status", "NOT_CHECKED")
            row["last_verified_status"] = previous_status if previous_status in VALID else before.get("last_verified_status", "")
            row["last_verified_at_utc"] = (before.get("checked_at_utc", "") if previous_status in VALID
                                          else before.get("last_verified_at_utc", ""))
            for key in HEADINGS:
                if key in observed and key not in ("url", "index", "slot", "category", "source_sitemap", "priority"):
                    row[key] = observed[key]
            new_status = row["today_status"]
            if previous_status in VALID and new_status in VALID and previous_status != new_status:
                event = (f"\n- **{now.isoformat(timespec='seconds')}** — {row['url']}: "
                         f"{previous_status} → {new_status}. "
                         f"Before: {before.get('reason', '')} ({before.get('checked_at_utc', 'unknown')}). "
                         f"After: {row['reason']} ({row['checked_at_utc']}). "
                         f"Impact: technical search-readiness changed; verify independently before asserting indexing/ranking. "
                         f"Evidence: {row['evidence']}.\n")
                found_events.append(event)
                changes += event
            print(f"{row['index']}: {new_status} {row['url']} — {row['reason'][:160]}")
    if not changes.strip():
        changes = "# Significant public search-readiness changes\n\nNo verified before/after transitions recorded.\n"
    issues, added, removed = source_drift(rows)
    day = now.date().isoformat()
    attempted = [r for r in rows if r.get("today_ist") == day and r.get("today_status") != "NOT_CHECKED"]
    counts = {s: sum(r.get("today_status") == s for r in attempted)
              for s in ("PASS", "WARN", "FAIL", "UNVERIFIED")}
    missing = [r for r in rows if r not in attempted]
    priority_issues = [r for r in attempted if r.get("today_status") in ("FAIL", "WARN", "UNVERIFIED")]
    notes = [f"# Tiny Steps — Rolling Search Readiness Snapshot ({day} IST)",
             "", f"Generated: {now.isoformat(timespec='seconds')}; hourly slot {slot}/24.",
             "", f"**Attempted today:** {len(attempted)}/202. **Pending today:** {len(missing)}.",
             f"**Statuses today:** {', '.join(f'{k} {v}' for k,v in counts.items())}.",
             "**Important:** GitHub source and sampled HTTP/robots/HTML checks are NOT proof of Google/Bing indexing, ranking, or AI citation.",
             "", "## Follow-up URLs"]
    for row in priority_issues[:40]:
        notes.append(f"- {row['today_status']} [{row['index']}] {row['url']} — {row.get('reason', '')}")
    if len(priority_issues) > 40:
        notes.append(f"- ... and {len(priority_issues)-40} more in MASTER_URL_TRACKER.csv")
    notes += ["", "## Unchecked today"]
    notes += [f"- [{r['index']}] {r['url']}" for r in missing[:40]]
    if len(missing) > 40:
        notes.append(f"- ... and {len(missing)-40} more")
    notes += ["", "## Source sitemap drift"]
    notes += ["- " + x for x in issues] if issues else ["- None found in current checked-in sitemap files"]
    notes += ["", "## Confirmed status transitions in this run"]
    notes += [s.strip() for s in found_events] if found_events else ["- None"]
    notes += ["", "Statuses refer only to checks actually observed on their recorded dates; stale rows do not count towards today's coverage.", ""]
    out = Path(a.out_dir)
    out.mkdir(parents=True, exist_ok=True)
    with (out / "MASTER_URL_TRACKER.csv").open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=HEADINGS, extrasaction="ignore")
        w.writeheader()
        w.writerows(rows)
    (out / "CHANGES.md").write_text(changes, encoding="utf-8")
    (out / "LATEST_SUMMARY.md").write_text("\n".join(notes), encoding="utf-8")
    print(json.dumps({"slot": slot, "attempted_today": len(attempted), "counts": counts,
                      "pending_today": len(missing), "source_drift": issues, "new_transitions": len(found_events)}))
    if a.dry_run:
        print("DRY RUN: no network requests made and original tracker unchanged.")


if __name__ == "__main__":
    main()
