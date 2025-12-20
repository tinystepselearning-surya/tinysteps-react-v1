/**
 * Test script for cleanupGamesCatalogNow callable function
 * 
 * Run: ADMIN_EMAIL=x ADMIN_PASSWORD=y node scripts/test-catalog-cleanup.cjs
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

async function testCatalogCleanup() {
  console.log('🧹 Testing cleanupGamesCatalogNow function...\n');

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
    console.log('  ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=xxx node scripts/test-catalog-cleanup.cjs');
    process.exit(1);
  }

  try {
    console.log('📧 Signing in as:', adminEmail);
    const userCred = await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
    console.log('✅ Signed in as:', userCred.user.uid);
    console.log('');

    // 3. Call the cleanup function
    console.log('🚀 Calling cleanupGamesCatalogNow...');
    const cleanupGamesCatalogNow = httpsCallable(functions, 'cleanupGamesCatalogNow');
    const result = await cleanupGamesCatalogNow();

    console.log('✅ Function executed successfully!\n');
    console.log('📦 Result:', JSON.stringify(result.data, null, 2));

    // 4. Display cleanup summary
    const data = result.data;
    
    if (data.cleanup) {
      console.log('\n🧹 Cleanup Summary:');
      console.log(`  - Deleted fields: ${data.cleanup.totalDeleted ?? 0}`);
      console.log(`  - Normalized games: ${data.cleanup.gamesNormalized ?? 0}`);
      
      const deletedDotKeys = data.cleanup.deletedDotKeys ?? [];
      if (deletedDotKeys.length > 0) {
        console.log('\n🗑️  Deleted dot-key fields:');
        deletedDotKeys.forEach(field => {
          console.log(`    - ${field}`);
        });
      }
      
      if (data.cleanup.deletedCategoryHyphenKey) {
        console.log('\n🗑️  Deleted: categories["letter-sounds"] (hyphenated version)');
      }
      
      if (data.cleanup.deletedLegacyGamesBlock) {
        console.log('\n🗑️  Deleted: categories.games (legacy nested block)');
      }
      
      const normalizedGames = data.cleanup.normalizedGames ?? [];
      if (normalizedGames.length > 0) {
        console.log('\n🔧 Normalized games:');
        normalizedGames.forEach(gameId => {
          console.log(`    - ${gameId}`);
        });
      }
    }

    // 5. Display final catalog state
    if (data.finalCatalog) {
      const catalog = data.finalCatalog;
      
      if (catalog.games) {
        const gameIds = Object.keys(catalog.games);
        console.log('\n🎮 Games in catalog:', gameIds.length);
        gameIds.forEach(id => {
          const game = catalog.games[id];
          console.log(`  - ${id}: ${game?.title || id} (category: ${game?.category || 'none'}, ${game?.totalLevels || 0} levels)`);
        });
      }
      
      if (catalog.categories) {
        const categoryIds = Object.keys(catalog.categories);
        console.log('\n📁 Categories in catalog:', categoryIds.length);
        categoryIds.forEach(id => {
          const category = catalog.categories[id];
          console.log(`  - ${id}: ${category?.label || id} (order: ${category?.order || 0})`);
        });
      }
      
      console.log('\n📌 Catalog version:', catalog.version || 'not set');
    }

    console.log('\n✅ Cleanup complete! Catalog is now normalized.');
    console.log('');
    console.log('Next steps:');
    console.log('  1. Verify in Firebase Console: config/gamesCatalog');
    console.log('  2. Test Parent Dashboard at /parent?tab=games-progress');
    console.log('  3. Confirm no dot-key fields remain');
    
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.code) {
      console.error('   Code:', error.code);
    }
    if (error.details) {
      console.error('   Details:', error.details);
    }
    process.exit(1);
  }
}

testCatalogCleanup();
