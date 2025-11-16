/*
Node helper to create/update the Secret Manager secret 'groq-api-key'
Usage (local):
  node scripts/setGroqSecret.js "sk-yournewkey"
Or use env var: NEW_GROQ_KEY=sk-... node scripts/setGroqSecret.js

This script requires Application Default Credentials with sufficient permissions or gcloud auth application-default login.
*/

const {SecretManagerServiceClient} = require('@google-cloud/secret-manager');
const fs = require('fs');

async function setSecret(projectId, secretName, value) {
  const client = new SecretManagerServiceClient();
  const parent = `projects/${projectId}`;

  // Check if secret exists
  try {
    await client.getSecret({name: `${parent}/secrets/${secretName}`});
  } catch (err) {
    if (err.code === 5 || (err.code === undefined && /NotFound/.test(err.message))) {
      console.log('Secret not found; creating');
      await client.createSecret({parent, secretId: secretName, secret: {replication: {automatic: {}}}});
    } else {
      throw err;
    }
  }

  const payload = Buffer.from(value, 'utf8');
  const [version] = await client.addSecretVersion({parent: `${parent}/secrets/${secretName}`, payload: {data: payload}});
  return version.name;
}

async function main() {
  let value = process.argv[2] || process.env.NEW_GROQ_KEY;
  if (!value) {
    console.error('Provide a new API key as argument or NEW_GROQ_KEY environment variable');
    process.exit(1);
  }
  const projectId = process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT || (process.env.FIREBASE_CONFIG && JSON.parse(process.env.FIREBASE_CONFIG).projectId) || '';
  if (!projectId) {
    console.error('Project ID missing. Set GCLOUD_PROJECT env or have FIREBASE_CONFIG in env.');
    process.exit(1);
  }
  try {
    const versionName = await setSecret(projectId, 'groq-api-key', value);
    console.log(`Successfully stored secret version: ${versionName}`);
  } catch (err) {
    console.error('Failed to store secret:', err);
    process.exit(1);
  }
}

main();
