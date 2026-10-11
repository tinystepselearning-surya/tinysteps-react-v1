#!/usr/bin/env bash
set -euo pipefail
# The runner validates CI identity, current main, compiled exports, and live
# inventories before the first mutation. Never invoke this during an audit.
node scripts/deployment/retire-session-functions.mjs
