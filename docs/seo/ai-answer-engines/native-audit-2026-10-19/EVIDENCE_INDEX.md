# Evidence index

The 48-cell evaluation is the observation ledger. It links each completed result to an original native UI snapshot and, except the first ChatGPT result, a viewport screenshot. The screenshots are captured browser pixels; they were not recreated from answers. JSON snapshots record UTC capture times, observed session URLs and accessible DOM text. The evaluation converts capture times to IST. The original P01 `.txt` files are native accessibility exports; their timestamp provenance is explained in the report.

- `Pxx-chatgpt`, `Pxx-gemini`, `Pxx-aimode`: native responses to the exact parent prompt, fresh conversation/thread.
- `Pxx-chatgpt-source-N`: source disclosure attempts saved separately. Some files contain only the unchanged answer because a source dialog did not open. Do not interpret every file as a fully expanded source panel.
- `P01-citation-destination`, `P08-citation-destination`: exact post-redirect Tiny Steps destinations plus upstream load limitation.
- `P05-medium-destination`: post-redirect Medium URL and browser block. Article text was independently read through web retrieval, as described in REPORT.md.
- `perplexity-block`: actual P01 response requiring sign-up; common blocker for unsubmitted P02–P12.
- `gsc-ui-access`: domain-property navigation ended at public about/sign-in interface.
- `readingrockets-browser-block`: observed security verification; no original-page browser review claimed.
- `origin-attempt-*`: one ordinary read-only production request and received upstream failure; not a site-outage verdict.

`EVIDENCE_MANIFEST.csv` records SHA-256 hashes and byte lengths. The `data/` CSVs are bounded first-party source exports and a 12-article source review. Missing GSC rows are blank, not zero; index verdicts remain unverified. The date-only site series is not summed with the page-cohort exports.

Guest conversation URLs may expire or fail to reopen after the chat is cleared. The saved files preserve what was observed. No account credentials, follow-up child information, form submissions or production changes were used.
