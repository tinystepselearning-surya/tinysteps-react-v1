# Smoke Test Sheet

Run immediately before and after cutover. Keep scope production-safe.

## Test matrix

| Test ID | Scenario | Environment | Expected | Result | Evidence | Owner |
|---|---|---|---|---|---|---|
| ST-01 | Deploy no-risk change to functions | staging/prod | Deploy succeeds with no auth permission error | TBD | CI run URL | TBD |
| ST-02 | Deploy no-risk hosting change | staging/prod | Hosting deploy succeeds | TBD | CI run URL | TBD |
| ST-03 | Invoke one callable admin function | staging/prod | 2xx success and expected payload | TBD | log/curl output | TBD |
| ST-04 | Run one local admin script | local | Script runs with ADC/SA and completes | TBD | terminal output | TBD |
| ST-05 | Auth-sensitive user workflow | staging/prod | Login + protected route access works | TBD | screenshot/log | TBD |
| ST-06 | Realtime Database read/write path (if used) | staging/prod | No permission regressions | TBD | logs/console | TBD |
| ST-07 | Cloud Functions error logs | prod | No spike of auth/permission errors | TBD | Cloud Logging query | TBD |

## Recommended log filters

- `resource.type="cloud_function" AND ("permission-denied" OR "auth" OR "credential")`
- `resource.type="cloud_run_revision" AND ("permission-denied" OR "unauthenticated")`

## Pass criteria

- All critical tests (`ST-01` through `ST-05`) pass.
- No new auth/permission error trend within first 60 minutes.
- Any optional RTDB check (`ST-06`) is explicitly marked `not-applicable` or `pass`.
