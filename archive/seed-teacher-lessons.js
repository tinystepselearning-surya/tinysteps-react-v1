/*
 * seeds teacherLessons collection in Firestore emulator
 * Usage (emulator):
 * FIRESTORE_EMULATOR_HOST=127.0.0.1:8085 GOOGLE_CLOUD_PROJECT=tinysteps-react-v1 node scripts/seed-teacher-lessons.js
 */
const admin = require('firebase-admin');

async function main() {
  const projectId = process.env.GOOGLE_CLOUD_PROJECT || 'tinysteps-react-v1';
  if (!process.env.FIRESTORE_EMULATOR_HOST) {
    console.warn('Warning: FIRESTORE_EMULATOR_HOST is not set. This will write to production Firestore if credentials are present. Aborting.');
    process.exit(1);
  }

  admin.initializeApp({ projectId });
  const db = admin.firestore();

  const lessons = [
    {
      id: 'phonics-satpin-week1',
      title: 'SATPIN - Week 1: S, A, T',
      category: 'phonics',
      level: 'Beginner',
      ageRange: '4-6',
      durationMinutes: 20,
      tags: ['satpin', 'letters', 'phonics', 'beginner'],
      canvaUrl: 'https://www.canva.com/design/satpin-week1-example',
      thumbnailUrl: 'https://example.com/thumbnails/satpin-week1.jpg',
      isActive: true,
      isDraft: false,
    },
    {
      id: 'phonics-magic-e-story',
      title: 'Magic E - Long Vowel Story',
      category: 'phonics',
      level: 'Intermediate',
      ageRange: '6-8',
      durationMinutes: 25,
      tags: ['magic-e', 'vowels', 'storytime'],
      canvaUrl: 'https://www.canva.com/design/magice-story-example',
      thumbnailUrl: 'https://example.com/thumbnails/magice-story.jpg',
      isActive: true,
      isDraft: false,
    },
    {
      id: 'grammar-nouns-basics',
      title: 'Nouns: People, Places, Things',
      category: 'grammar',
      level: 'Beginner',
      ageRange: '5-7',
      durationMinutes: 18,
      tags: ['nouns', 'grammar', 'vocabulary'],
      canvaUrl: 'https://www.canva.com/design/nouns-basics-example',
      thumbnailUrl: 'https://example.com/thumbnails/nouns-basics.jpg',
      isActive: true,
      isDraft: false,
    },
    {
      id: 'grammar-verbs-action',
      title: 'Verbs: Action Words',
      category: 'grammar',
      level: 'Beginner',
      ageRange: '5-7',
      durationMinutes: 20,
      tags: ['verbs', 'grammar', 'action'],
      canvaUrl: 'https://www.canva.com/design/verbs-action-example',
      thumbnailUrl: 'https://example.com/thumbnails/verbs-action.jpg',
      isActive: true,
      isDraft: false,
    },
    {
      id: 'speaking-introducing-myself',
      title: 'Introducing Myself - Short Speech',
      category: 'speaking',
      level: 'Beginner',
      ageRange: '6-9',
      durationMinutes: 15,
      tags: ['public-speaking', 'introductions', 'confidence'],
      canvaUrl: 'https://www.canva.com/design/introducing-myself-example',
      thumbnailUrl: 'https://example.com/thumbnails/introducing-myself.jpg',
      isActive: true,
      isDraft: false,
    },
    {
      id: 'speaking-picture-talk',
      title: 'Picture Talk: Describe and Discuss',
      category: 'speaking',
      level: 'Intermediate',
      ageRange: '7-10',
      durationMinutes: 22,
      tags: ['picture-talk', 'speaking', 'descriptive-language'],
      canvaUrl: 'https://www.canva.com/design/picture-talk-example',
      thumbnailUrl: 'https://example.com/thumbnails/picture-talk.jpg',
      isActive: true,
      isDraft: false,
    },
  ];

  for (const lesson of lessons) {
    const docRef = db.collection('teacherLessons').doc(lesson.id);
    const data = Object.assign({}, lesson);
    delete data.id;
    await docRef.set(data, { merge: true });
    console.log('Seeded', lesson.id);
  }

  console.log('Seeding complete');
  process.exit(0);
}

main().catch((err) => {
  console.error('Seeding failed', err);
  process.exit(1);
});
