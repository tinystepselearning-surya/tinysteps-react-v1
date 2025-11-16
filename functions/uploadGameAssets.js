// Uploads game assets (images, audio, certificates) to Cloud Storage with long cache headers.
const admin = require('firebase-admin');
const path = require('path');

try {
  admin.initializeApp();
} catch (_) {
  /* already initialized */
}

const bucket = admin.storage().bucket();

async function uploadGameAssets() {
  const assetsToUpload = [
    // Images
    { source: './assets/spellbee/cat.png', destination: 'images/spellbee/cat.png' },
    { source: './assets/spellbee/dog.png', destination: 'images/spellbee/dog.png' },
    // Audio pronunciations
    { source: './assets/audio/cat.mp3', destination: 'pronunciations/spellbee/cat.mp3' },
    { source: './assets/audio/dog.mp3', destination: 'pronunciations/spellbee/dog.mp3' },
  ];

  for (const asset of assetsToUpload) {
    const abs = path.resolve(__dirname, asset.source);
    await bucket.upload(abs, {
      destination: asset.destination,
      metadata: {
        cacheControl: 'public, max-age=31536000',
      },
    });
    console.log(`✅ Uploaded ${asset.destination}`);
  }
}

if (require.main === module) {
  uploadGameAssets().catch(console.error);
}

module.exports = { uploadGameAssets };
