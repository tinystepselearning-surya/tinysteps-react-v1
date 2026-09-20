const admin = require('firebase-admin');

const EXPECTED_PROJECT_ID = 'tinysteps-react-v1';
const CONFIG_COLLECTION = 'attendanceValidationConfig';
const CONFIG_DOC = 'teams';

function readArg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? String(process.argv[index + 1] || '').trim() : '';
}

function isGuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    .test(String(value || '').trim());
}

async function run() {
  const projectId = readArg('--project');
  const organizerUserId = readArg('--organizer-user-id').toLowerCase();
  const writeMode = process.argv.includes('--write');

  if (projectId !== EXPECTED_PROJECT_ID) {
    throw new Error(
      `Refusing to run: --project must be ${EXPECTED_PROJECT_ID}.`,
    );
  }

  if (!isGuid(organizerUserId)) {
    throw new Error(
      '--organizer-user-id must be a valid Microsoft Entra object-ID GUID.',
    );
  }

  if (!admin.apps.length) {
    admin.initializeApp({projectId});
  }

  const db = admin.firestore();
  const configRef = db.collection(CONFIG_COLLECTION).doc(CONFIG_DOC);
  const before = await configRef.get();
  const currentValue = before.exists
    ? String(before.get('organizerUserId') || '').trim().toLowerCase()
    : '';
  const currentValid = isGuid(currentValue);

  console.log({
    projectId,
    configDocument: `${CONFIG_COLLECTION}/${CONFIG_DOC}`,
    exists: before.exists,
    currentValueValid: currentValid,
    requestedValueValid: true,
    requestedMatchesCurrent: currentValid && currentValue === organizerUserId,
    writeMode,
  });

  if (!writeMode) {
    console.log('Dry run only. Re-run with --write to persist the config.');
    return;
  }

  if (currentValid && currentValue !== organizerUserId) {
    throw new Error(
      'Refusing to replace an existing valid organizerUserId automatically.',
    );
  }

  await configRef.set({
    schemaVersion: 1,
    organizerUserId,
    source: 'manual_verified_teams_organizer',
    browserAccessAllowed: false,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    ...(before.exists
      ? {}
      : {createdAt: admin.firestore.FieldValue.serverTimestamp()}),
  }, {merge: true});

  const after = await configRef.get();
  const storedValue = String(
    after.get('organizerUserId') || '',
  ).trim().toLowerCase();

  if (storedValue !== organizerUserId) {
    throw new Error('Organizer config verification failed after write.');
  }

  console.log({
    updated: true,
    verified: true,
    configDocument: `${CONFIG_COLLECTION}/${CONFIG_DOC}`,
    browserAccessAllowed: after.get('browserAccessAllowed') === false,
  });
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
