#!/usr/bin/env bash
# Owner-operated disposable local emulator only. No Firebase CLI, ADC, or deploy.
set -euo pipefail
test "$#" -eq 1 || { echo 'Usage: bash run-identity-transport-emulator.sh /path/to/pinned-emulator.jar' >&2; exit 2; }
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$root"
test "$(node --version)" = 'v22.22.1' || { echo 'PINNED_NODE_REQUIRED' >&2; exit 2; }
command -v java >/dev/null
command -v lsof >/dev/null
command -v shasum >/dev/null
java_version="$(java -version 2>&1)"
case "$java_version" in
  *'"21.'*|*'"21"'*) ;;
  *) echo 'JAVA_21_REQUIRED' >&2; exit 2;;
esac
test -f "$1" || { echo 'PINNED_EMULATOR_JAR_REQUIRED' >&2; exit 2; }
test -z "$(git status --porcelain)" || { echo 'CLEAN_CHECKOUT_REQUIRED' >&2; exit 2; }
if lsof -nP -iTCP:8788 -sTCP:LISTEN >/dev/null 2>&1; then
  echo 'DEDICATED_PORT_ALREADY_IN_USE' >&2
  exit 2
fi
work="$(mktemp -d "${TMPDIR:-/tmp}/tsos-identity-emulator.XXXXXX")"
pid=''
cleanup(){
  rc=$?
  trap - EXIT
  if [ -n "$pid" ]; then
    kill "$pid" 2>/dev/null || true
    wait "$pid" 2>/dev/null || true
  fi
  if [ "$rc" -ne 0 ] && [ -f "$work/emulator.log" ]; then
    echo 'Synthetic emulator startup/verification failed; local-only log tail:' >&2
    tail -n 20 "$work/emulator.log" >&2 || true
  fi
  rm -rf -- "$work"
  exit "$rc"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
mkdir "$work/home" "$work/tmp"
cp "$1" "$work/emulator.jar"
printf '%s  %s\n' '9d43599ed6151199e8d604dc87fac51218e49e5f3a48519b1ae560bbe5e3382d' "$work/emulator.jar" | shasum -a 256 -c -
echo 'Verified Firestore emulator 1.19.8 checksum'
echo "Checkout: $(git rev-parse HEAD)"
env -i PATH="$PATH" HOME="$work/home" TMPDIR="$work/tmp" TZ=UTC \
  java -Duser.home="$work/home" -Djava.io.tmpdir="$work/tmp" -jar "$work/emulator.jar" \
  --host 127.0.0.1 --port 8788 --project_id demo-tsos-identity-transport \
  --single_project_mode true --single_project_mode_error true > "$work/emulator.log" 2>&1 &
pid=$!
ready=0
for attempt in $(seq 1 60); do
  if ! kill -0 "$pid" 2>/dev/null; then echo 'EMULATOR_EXITED' >&2; exit 1; fi
  if lsof -nP -a -p "$pid" -iTCP:8788 -sTCP:LISTEN >/dev/null 2>&1; then ready=1; break; fi
  sleep 1
done
test "$ready" -eq 1 || { echo 'EMULATOR_STARTUP_TIMEOUT' >&2; exit 1; }
env -i PATH="$PATH" HOME="$work/home" TMPDIR="$work/tmp" TZ=UTC \
  TSOS_IDENTITY_EMULATOR_ONLY=1 FIRESTORE_EMULATOR_HOST=127.0.0.1:8788 \
  GCLOUD_PROJECT=demo-tsos-identity-transport \
  node --unhandled-rejections=strict --test scripts/verification/identity-transport-emulator.node-test.mjs
