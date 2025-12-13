const admin = require('firebase-admin');
const path = require('path');

// Use environment variable or fallback to a default project id for the emulator
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || process.env.PROJECT_ID || 'demo-tinysteps';

// Initialize default app. When running against emulator or production, admin SDK will use credentials
try {
  admin.initializeApp({ projectId: PROJECT_ID });
} catch (e) {
  // admin.app() is available if the app is already initialized
  admin.app();
}

const db = admin.firestore();

// allow loading the courses via a JSON payload so it's explicit
let defaultCourses = [];
try {
  const jsonPath = path.join(__dirname, 'courses.json');
  defaultCourses = require(jsonPath) || [];
} catch (e) {
  // fallback to a hardcoded list in case the JSON file is not present
  defaultCourses = [
  'Early Phonics',
  'Phonics Foundations',
  'Advanced Phonics',
  'Basic Grammar',
  'Advanced Grammar & Writing',
  'Basic Public Speaking (Early Speakers)',
  'Advanced Public Speaking (Young Leaders)',
  'Spoken English & Confident Communication (Adults)'
  ];
  // Normalize into objects with id/title
  defaultCourses = defaultCourses.map(title => ({
    id: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    title,
    description: `${title} by Tiny Steps`,
    level: 'general'
  }));
}

async function seed() {
  console.log('Seeding courses...');
  for (const c of defaultCourses) {
    const id = c.id || (c.title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const courseRef = db.collection('courses').doc(id);
    await courseRef.set({
      id,
      title: c.title || c.name || c.title,
      description: c.description || `${c.title} by Tiny Steps`,
      level: c.level || c.levelName || 'general',
      tags: c.tags || [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    console.log('Seeded:', id);
  }
  console.log('Seeding complete.');
}

seed().catch((err) => { console.error('Error seeding courses', err); process.exit(1); });
