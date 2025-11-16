// Daily aggregation of gameStats for systemMetrics.
const functions = require('firebase-functions');
const admin = require('firebase-admin');

try {
  admin.initializeApp();
} catch (_) {
  /* already initialized */
}

const db = admin.firestore();

exports.aggregateDailyMetrics = functions.pubsub
  .schedule('0 2 * * *') // 2 AM daily
  .timeZone('Asia/Kolkata')
  .onRun(async () => {
    const todayIso = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const start = new Date(`${todayIso}T00:00:00.000Z`);
    const end = new Date(`${todayIso}T23:59:59.999Z`);

    try {
      const sessions = await db
        .collectionGroup('gameStats')
        .where('timestamp', '>=', start)
        .where('timestamp', '<=', end)
        .get();

      const stats: any = {
        totalSessions: sessions.size,
        byGame: {},
        avgAccuracy: 0,
        totalPoints: 0,
      };

      let totalAccuracy = 0;
      sessions.forEach((doc) => {
        const data = doc.data();
        const game = data.game || 'unknown';
        stats.byGame[game] = (stats.byGame[game] || 0) + 1;
        if (data.correct) totalAccuracy += 1;
      });

      stats.avgAccuracy = sessions.size ? Number(((totalAccuracy / sessions.size) * 100).toFixed(2)) : 0;

      await db.collection('systemMetrics').doc(todayIso).set({
        ...stats,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`✅ Daily metrics aggregated for ${todayIso}`);
    } catch (error) {
      console.error('Error aggregating metrics:', error);
    }
  });
