#!/usr/bin/env node

const DEFAULT_HOST = 'tinystepslearning.com';

function validateKey(key) {
  return /^[A-Za-z0-9-]{8,128}$/.test(key);
}

async function main() {
  const key = (process.env.INDEXNOW_KEY || '').trim();
  if (!key) {
    console.log('INDEXNOW_KEY not set; skipping IndexNow ownership verification.');
    return;
  }

  if (!validateKey(key)) {
    throw new Error('INDEXNOW_KEY format is invalid; expected 8-128 letters, numbers, or dashes.');
  }

  const host = (process.env.INDEXNOW_HOST || DEFAULT_HOST).trim().toLowerCase();
  const keyLocation = (process.env.INDEXNOW_KEY_LOCATION || `https://${host}/${key}.txt`).trim();
  const url = new URL(keyLocation);

  if (url.hostname.toLowerCase() !== host) {
    throw new Error('INDEXNOW_KEY_LOCATION must be hosted on the same host being verified.');
  }

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Cache-Control': 'no-cache',
      'User-Agent': 'TinySteps-IndexNow-Verification/1.0',
    },
  });

  if (!response.ok) {
    throw new Error(`IndexNow key file verification failed with HTTP ${response.status}.`);
  }

  const body = (await response.text()).trim();
  if (body !== key) {
    throw new Error('IndexNow key file is reachable but its contents do not match INDEXNOW_KEY.');
  }

  console.log(`Verified IndexNow ownership key on ${host}.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
