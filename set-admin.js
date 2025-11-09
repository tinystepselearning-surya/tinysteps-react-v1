const admin = require('firebase-admin');
const serviceAccount = require('./tinysteps-react-v1-firebase-adminsdk-fbsvc-54979d3c19.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const uid = 'RxKTaw9XKNRrWyEPkL9zrYZ8RXy2';

admin.auth().setCustomUserClaims(uid, {
  admin: true,
  role: 'admin',
  teacher: false,
  parent: false,
  kid: false,
  learningPartner: false,
}).then(() => {
  console.log('Admin claims set successfully for UID:', uid);
  process.exit(0);
}).catch((error) => {
  console.error('Error setting claims:', error);
  process.exit(1);
});