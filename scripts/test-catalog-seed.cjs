/**
 * Test script for ensureGamesCatalogNow callable function
 * 
 * Run: node scripts/test-catalog-seed.js
 * Requires: Admin user credentials in Firebase Auth
 */

const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getFunctions, httpsCallable } = require('firebase/functions');

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || 'AIzaSyBZ5h2M3hataZjWM7480e76QAiFmEVK37Y',
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || 'tinysteps-react-v1.firebaseapp.com',
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'tinysteps-react-v1',
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || 'tinysteps-react-v1.firebasestorage.app',
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '31484691215',
  appId: process.env.VITE_FIREBASE_APP_ID || '1:31484691215:web:2e8854696bc7e27b63347a',
};

async function testCatalogSeed() {
  console.log('🔧 Testing ensureGamesCatalogNow function...\n');

  // 1. Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const functions = getFunctions(app, 'asia-south1');

  // 2. Sign in as admin (you must provide credentials)
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.error('❌ Error: ADMIN_EMAIL and ADMIN_PASSWORD env vars required');
    console.log('\nUsage:');
    console.log('  ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=xxx node scripts/test-catalog-seed.js');
    process.exit(1);
  }

  try {
    console.log('📧 Signing in as:', adminEmail);
    const userCred = await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
    console.log('✅ Signed in as:', userCred.user.uid);
    console.log('');

    // 3. Call the function
    console.log('🚀 Calling ensureGamesCatalogNow...');
    const ensureGamesCatalogNow = httpsCallable(functions, 'ensureGamesCatalogNow');
    const result = await ensureGamesCatalogNow();

    console.log('✅ Function executed successfully!\n');
    console.log('📦 Result:', JSON.stringify(result.data, null, 2));

    // 4. Check catalog content
    const catalog = result.data.catalog;
    if (catalog && catalog.games) {
      const gameIds = Object.keys(catalog.games);
      console.log('\n🎮 Games in catalog:', gameIds.length);
      gameIds.forEach(id => {
        const game = catalog.games[id];
        console.log(`  - ${id}: ${game.title} (${game.totalLevels} levels)`);
      });
    }

    if (result.data.patchResult && result.data.patchResult.patched) {
      console.log('\n🔧 Patched fields:', result.data.patchResult.patchedPaths);
    }

    console.log('\n✅ Test complete! Catalog is ready.');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.code) {
      console.error('   Code:', error.code);
    }
    process.exit(1);
  }
}

testCatalogSeed();
