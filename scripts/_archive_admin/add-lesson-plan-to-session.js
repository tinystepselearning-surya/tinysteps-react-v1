/**
 * Script to add Canva lesson plan URL to a session
 * 
 * Usage:
 * 1. Install Firebase Admin SDK: npm install firebase-admin
 * 2. Update the sessionId and lessonPlanUrl below
 * 3. Run: node scripts/add-lesson-plan-to-session.js
 */

import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read service account key
const serviceAccountPath = join(__dirname, '..', 'tinysteps-react-v1-firebase-adminsdk-fbsvc-75997bbcea.json');
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

/**
 * Add lesson plan URL to a session
 * @param {string} sessionId - The Firestore session document ID
 * @param {string} lessonPlanUrl - The Canva embed URL
 */
async function addLessonPlanToSession(sessionId, lessonPlanUrl) {
  try {
    console.log(`Adding lesson plan to session: ${sessionId}`);
    
    // Validate URL
    if (!lessonPlanUrl.startsWith('https://')) {
      throw new Error('Lesson plan URL must be a valid HTTPS URL');
    }

    // Update the session document
    await db.collection('sessions').doc(sessionId).update({
      lessonPlanUrl: lessonPlanUrl,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: 'admin-script',
    });

    console.log('✅ Success! Lesson plan URL added to session.');
    console.log(`   Session ID: ${sessionId}`);
    console.log(`   Lesson Plan URL: ${lessonPlanUrl}`);
    
    // Fetch and display the updated session
    const sessionDoc = await db.collection('sessions').doc(sessionId).get();
    if (sessionDoc.exists) {
      console.log('\n📄 Updated session data:');
      console.log(JSON.stringify(sessionDoc.data(), null, 2));
    }
    
  } catch (error) {
    console.error('❌ Error adding lesson plan:', error.message);
    throw error;
  }
}

/**
 * Example usage - Update these values
 */
const EXAMPLE_SESSION_ID = 'your-session-id-here';
const EXAMPLE_CANVA_URL = 'https://www.canva.com/design/DAGmsjeOkQU/ncrV_WOrvltcm8TR0-75Zg/view?embed';

// Main execution
(async () => {
  // Check if command line arguments are provided
  const sessionId = process.argv[2] || EXAMPLE_SESSION_ID;
  const lessonPlanUrl = process.argv[3] || EXAMPLE_CANVA_URL;

  if (sessionId === 'your-session-id-here') {
    console.log('\n⚠️  Please provide a valid session ID');
    console.log('\nUsage:');
    console.log('  node scripts/add-lesson-plan-to-session.js <sessionId> <canvaUrl>');
    console.log('\nExample:');
    console.log('  node scripts/add-lesson-plan-to-session.js abc123 "https://www.canva.com/design/ABC/view?embed"');
    process.exit(1);
  }

  try {
    await addLessonPlanToSession(sessionId, lessonPlanUrl);
    console.log('\n✨ Script completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  }
})();

export { addLessonPlanToSession };
