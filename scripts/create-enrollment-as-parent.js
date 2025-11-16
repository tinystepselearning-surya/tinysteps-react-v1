const admin = require('firebase-admin');

admin.initializeApp({ projectId: 'demo-tinysteps' });

async function main(){
  try{
    const parent = await admin.auth().getUserByEmail('parent@example.com');
    const customToken = await admin.auth().createCustomToken(parent.uid, { parent:true, role:'parent'});
    console.log('Custom token for Parent created');
    const exchange = await fetch('http://localhost:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=fake-api-key', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ token: customToken, returnSecureToken: true })});
    const exchangeJson = await exchange.json();
    if(!exchange.ok){ console.error('Token exchange failed', exchangeJson); process.exit(1); }

    const idToken = exchangeJson.idToken;
    console.log('Obtained idToken for Parent length:', idToken.length);

    // Attempt to create enrollment as Parent
    const enrollmentDoc = { fields: {
        studentId: { stringValue: 'kid-test-001' },
        courseId: { stringValue: 'advanced-phonics' },
        teacherId: { nullValue: null },
        lpId: { stringValue: 'b1bHXtAWeeRbP47NFymQswyPUCIP' },
        parentId: { stringValue: parent.uid },
        status: { stringValue: 'pending_teacher' },
        ratePerSession: { integerValue: '500' },
        billingCycle: { stringValue: 'monthly' },
        createdAt: { timestampValue: new Date().toISOString() },
        updatedAt: { timestampValue: new Date().toISOString() }
    }};

    const res = await fetch('http://localhost:8085/v1/projects/demo-tinysteps/databases/(default)/documents/enrollments', { method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${idToken}`}, body: JSON.stringify(enrollmentDoc) });
    const resJson = await res.json();
    if(!res.ok){ console.error('Parent enroll create failed (expected)', res.status, resJson); process.exit(0); }
    console.log('Parent Enrollment created (unexpected):', resJson.name);
  }catch(err){ console.error('Error', err); process.exit(1); }
}

main();
