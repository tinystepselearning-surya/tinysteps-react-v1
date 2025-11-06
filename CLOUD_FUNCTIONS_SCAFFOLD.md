# Cloud Functions Scaffold for Tiny Steps v1.0

## Functions Directory Structure

```
functions/
├── package.json
├── tsconfig.json
├── .eslintrc.js
├── src/
│   ├── index.ts                    # Main exports
│   │
│   ├── triggers/                   # Firestore triggers
│   │   ├── onSessionCompleted.ts
│   │   ├── onWorksheetSubmitted.ts
│   │   ├── onGameMastered.ts
│   │   ├── onPaymentReceived.ts
│   │   └── onUserCreated.ts
│   │
│   ├── scheduled/                  # Scheduled functions
│   │   ├── sendClassReminders.ts   # T-24h, T-2h, T-15m
│   │   ├── checkNoShows.ts         # T+30m after class
│   │   ├── updateSummaries.ts      # Daily rollup
│   │   ├── sendWeeklyDigest.ts     # Weekly parent emails
│   │   └── exportBackups.ts        # Daily Firestore export
│   │
│   ├── callable/                   # HTTPS callable functions
│   │   ├── adminCreateUser.ts      # (already exists)
│   │   ├── requestReschedule.ts
│   │   ├── processPayment.ts
│   │   ├── verifyManualPayment.ts
│   │   ├── generateInvoice.ts
│   │   ├── assignSubstitute.ts
│   │   └── calculateEarnings.ts
│   │
│   ├── utils/                      # Shared utilities
│   │   ├── audit.ts                # Audit logging helper
│   │   ├── notifications.ts        # Send email/SMS/WhatsApp
│   │   ├── summaries.ts            # Summary doc updates
│   │   ├── mastery.ts              # Mastery calculation
│   │   ├── reminders.ts            # Reminder scheduling
│   │   └── validators.ts           # Input validation
│   │
│   └── config/                     # Configuration
│       ├── constants.ts
│       ├── templates.ts            # Email/SMS templates
│       └── env.ts                  # Environment variables
```

## Core Function Implementations

### 1. onSessionCompleted (Trigger)

```typescript
// functions/src/triggers/onSessionCompleted.ts

import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { logAudit } from '../utils/audit';
import { updateStudentSummary } from '../utils/summaries';
import { sendNotification } from '../utils/notifications';

export const onSessionCompleted = onDocumentUpdated({
  document: 'sessions/{sessionId}',
  region: 'asia-south1',
}, async (event) => {
  const before = event.data?.before.data();
  const after = event.data?.after.data();
  
  // Only trigger when status changes to 'completed'
  if (before?.status !== 'completed' && after?.status === 'completed') {
    const db = getFirestore();
    const sessionId = event.params.sessionId;
    const { studentId, teacherId, startAt, outcomes, rubric, topicsCovered } = after;
    
    const batch = db.batch();
    
    try {
      // 1. Mark attendance as present
      const attendanceDate = new Date(startAt).toISOString().split('T')[0].replace(/-/g, '');
      const attendanceRef = db.doc(`students/${studentId}/attendance/${attendanceDate}`);
      batch.set(attendanceRef, {
        status: 'present',
        sessionId,
        markedBy: teacherId,
        markedAt: FieldValue.serverTimestamp(),
        updatedBy: teacherId,
        updatedAt: FieldValue.serverTimestamp()
      });
      
      // 2. Update curriculum topics
      if (topicsCovered && topicsCovered.length > 0) {
        for (const topicId of topicsCovered) {
          const curriculumRef = db.doc(`students/${studentId}/curriculum/${topicId}`);
          batch.set(curriculumRef, {
            status: 'completed',
            completedAt: FieldValue.serverTimestamp(),
            sessionId,
            teacherNote: outcomes?.summary || '',
            updatedBy: teacherId,
            updatedAt: FieldValue.serverTimestamp()
          }, { merge: true });
        }
      }
      
      // 3. Update progress if rubric provided
      if (rubric) {
        // Calculate mastery score from rubric (1-5 scale)
        const avgScore = (rubric.accuracy + rubric.fluency + rubric.confidence) / 3;
        const masteryLevel = getMasteryLevel(avgScore);
        
        for (const topicId of topicsCovered) {
          const progressRef = db.doc(`students/${studentId}/progress/${topicId}`);
          batch.set(progressRef, {
            mastery: masteryLevel,
            scoreBand: getScoreBand(avgScore),
            lastEvidence: 'oral',
            rubric,
            sessionId,
            updatedBy: teacherId,
            updatedAt: FieldValue.serverTimestamp()
          }, { merge: true });
        }
      }
      
      // 4. Update student summary
      await updateStudentSummary(studentId, {
        lastSessionAt: startAt,
        totalSessionsCompleted: FieldValue.increment(1)
      });
      
      // 5. Update teacher earnings
      const teacherRef = db.doc(`teachers/${teacherId}`);
      batch.update(teacherRef, {
        sessionsCompleted: FieldValue.increment(1),
        totalEarnings: FieldValue.increment(after.rate || 0)
      });
      
      // Commit all updates atomically
      await batch.commit();
      
      // 6. Send notification to parent
      await sendNotification({
        type: 'session_completed',
        recipientIds: [after.parentId],
        title: 'Class Completed',
        body: `${after.studentName}'s class with ${after.teacherName} has been completed.`,
        data: {
          sessionId,
          studentId,
          outcomes: outcomes?.summary
        }
      });
      
      // 7. Audit log
      await logAudit({
        action: 'session_completed',
        actorUid: teacherId,
        targetRef: `sessions/${sessionId}`,
        metadata: { studentId, topicsCovered }
      });
      
      console.log(`✅ Session ${sessionId} completed successfully`);
      
    } catch (error) {
      console.error(`❌ Error processing session completion:`, error);
      throw error;
    }
  }
});

function getMasteryLevel(score: number): string {
  if (score < 1.5) return 'not_started';
  if (score < 2.5) return 'emerging';
  if (score < 3.5) return 'developing';
  if (score < 4.5) return 'proficient';
  return 'mastered';
}

function getScoreBand(score: number): string {
  const percentage = (score / 5) * 100;
  if (percentage <= 20) return '0-20';
  if (percentage <= 40) return '21-40';
  if (percentage <= 60) return '41-60';
  if (percentage <= 80) return '61-80';
  return '81-100';
}
```

### 2. onWorksheetSubmitted (Trigger)

```typescript
// functions/src/triggers/onWorksheetSubmitted.ts

import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { updateStudentSummary } from '../utils/summaries';
import { calculateMastery } from '../utils/mastery';

export const onWorksheetSubmitted = onDocumentCreated({
  document: 'submissions/{submissionId}',
  region: 'asia-south1',
}, async (event) => {
  const submission = event.data?.data();
  if (!submission) return;
  
  const { studentId, assignmentId, score, topicId } = submission;
  const db = getFirestore();
  
  try {
    // 1. Get assignment details
    const assignmentDoc = await db.doc(`assignments/${assignmentId}`).get();
    const assignment = assignmentDoc.data();
    
    if (!assignment) {
      console.error(`Assignment ${assignmentId} not found`);
      return;
    }
    
    // 2. Calculate mastery based on score
    const masteryLevel = calculateMastery(score);
    
    // 3. Update progress document
    const progressRef = db.doc(`students/${studentId}/progress/${topicId}`);
    await progressRef.set({
      mastery: masteryLevel,
      scoreBand: getScoreBand(score),
      lastEvidence: 'worksheet',
      lastScore: score,
      worksheetSubmissions: FieldValue.increment(1),
      updatedBy: studentId,
      updatedAt: FieldValue.serverTimestamp()
    }, { merge: true });
    
    // 4. Update student summary
    await updateStudentSummary(studentId, {
      worksheetsCompleted: FieldValue.increment(1),
      lastActivityAt: FieldValue.serverTimestamp()
    });
    
    // 5. Notify teacher if score is low
    if (score < 60) {
      await sendNotification({
        type: 'low_worksheet_score',
        recipientIds: [assignment.assignedBy],
        title: 'Student Needs Support',
        body: `${submission.studentName} scored ${score}% on ${assignment.title}`,
        data: { submissionId: event.params.submissionId, studentId }
      });
    }
    
    console.log(`✅ Worksheet submission ${event.params.submissionId} processed`);
    
  } catch (error) {
    console.error('❌ Error processing worksheet submission:', error);
    throw error;
  }
});
```

### 3. sendClassReminders (Scheduled)

```typescript
// functions/src/scheduled/sendClassReminders.ts

import { onSchedule } from 'firebase-functions/v2/scheduler';
import { getFirestore } from 'firebase-admin/firestore';
import { sendNotification } from '../utils/notifications';

export const sendClassReminders = onSchedule({
  schedule: 'every 15 minutes',
  region: 'asia-south1',
  timeZone: 'Asia/Kolkata'
}, async (event) => {
  const db = getFirestore();
  const now = new Date();
  
  // T-24h reminder
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  await sendReminders(db, tomorrow, '24h_before');
  
  // T-2h reminder
  const in2Hours = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  await sendReminders(db, in2Hours, '2h_before');
  
  // T-15m reminder
  const in15Min = new Date(now.getTime() + 15 * 60 * 1000);
  await sendReminders(db, in15Min, '15m_before');
});

async function sendReminders(db: FirebaseFirestore.Firestore, targetTime: Date, type: string) {
  const windowStart = new Date(targetTime.getTime() - 7.5 * 60 * 1000); // -7.5min
  const windowEnd = new Date(targetTime.getTime() + 7.5 * 60 * 1000);   // +7.5min
  
  const sessionsSnapshot = await db.collection('sessions')
    .where('status', '==', 'scheduled')
    .where('startAt', '>=', windowStart.toISOString())
    .where('startAt', '<=', windowEnd.toISOString())
    .get();
  
  const batch = db.batch();
  
  for (const doc of sessionsSnapshot.docs) {
    const session = doc.data();
    
    // Check if reminder already sent
    const reminders = session.remindersSent || [];
    if (reminders.includes(type)) continue;
    
    // Send notification
    await sendNotification({
      type: `class_reminder_${type}`,
      recipientIds: [session.parentId, session.studentId],
      title: getTitle(type),
      body: getMessage(session, type),
      data: { sessionId: doc.id, joinUrl: session.joinUrl }
    });
    
    // Mark reminder as sent
    batch.update(doc.ref, {
      remindersSent: [...reminders, type]
    });
  }
  
  await batch.commit();
  console.log(`✅ Sent ${sessionsSnapshot.size} reminders for ${type}`);
}

function getTitle(type: string): string {
  switch (type) {
    case '24h_before': return 'Class Tomorrow';
    case '2h_before': return 'Class in 2 Hours';
    case '15m_before': return 'Class Starting Soon';
    default: return 'Class Reminder';
  }
}

function getMessage(session: any, type: string): string {
  const time = new Date(session.startAt).toLocaleTimeString('en-IN', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  
  switch (type) {
    case '24h_before':
      return `${session.studentName} has a class tomorrow at ${time} with ${session.teacherName}`;
    case '2h_before':
      return `${session.studentName}'s class with ${session.teacherName} starts in 2 hours at ${time}`;
    case '15m_before':
      return `${session.studentName}'s class with ${session.teacherName} starts in 15 minutes!`;
    default:
      return `Reminder: Class at ${time}`;
  }
}
```

### 4. processPayment (Callable)

```typescript
// functions/src/callable/processPayment.ts

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { logAudit } from '../utils/audit';
// import Razorpay from 'razorpay'; // Uncomment when ready

export const processPayment = onCall({
  region: 'asia-south1',
}, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be logged in');
  }
  
  const { planId, amount, method } = request.data;
  const userId = request.auth.uid;
  const db = getFirestore();
  
  try {
    // 1. Validate user is parent
    const userDoc = await db.doc(`users/${userId}`).get();
    if (!userDoc.exists || userDoc.data()?.role !== 'parent') {
      throw new HttpsError('permission-denied', 'Only parents can make payments');
    }
    
    // 2. Get plan details
    const planDoc = await db.doc(`plans/${planId}`).get();
    if (!planDoc.exists) {
      throw new HttpsError('not-found', 'Plan not found');
    }
    
    const plan = planDoc.data();
    
    // 3. Create payment record
    const paymentRef = db.collection('payments').doc();
    const paymentData = {
      parentId: userId,
      planId,
      amount,
      tax: amount * 0.18, // 18% GST
      totalAmount: amount * 1.18,
      method,
      status: 'pending',
      createdAt: FieldValue.serverTimestamp(),
      createdBy: userId,
      updatedBy: userId,
      updatedAt: FieldValue.serverTimestamp()
    };
    
    if (method === 'online') {
      // TODO: Initialize Razorpay/Stripe
      // const razorpay = new Razorpay({...});
      // const order = await razorpay.orders.create({...});
      // paymentData.gatewayOrderId = order.id;
      
      paymentData.status = 'awaiting_gateway';
    } else if (method === 'manual') {
      paymentData.status = 'awaiting_verification';
    }
    
    await paymentRef.set(paymentData);
    
    // 4. Audit log
    await logAudit({
      action: 'payment_initiated',
      actorUid: userId,
      targetRef: `payments/${paymentRef.id}`,
      metadata: { amount, plan Id, method }
    });
    
    return {
      paymentId: paymentRef.id,
      status: paymentData.status,
      // gatewayOrderId: paymentData.gatewayOrderId
    };
    
  } catch (error: any) {
    console.error('Payment processing error:', error);
    throw new HttpsError('internal', error.message);
  }
});
```

## functions/src/index.ts

```typescript
// Main exports file

// Existing
export { adminCreateUser } from './adminCreateUser';
export { onAuthCreate } from './onAuthCreate';
export { onSessionCreate } from './onSessionCreate';

// Triggers
export { onSessionCompleted } from './triggers/onSessionCompleted';
export { onWorksheetSubmitted } from './triggers/onWorksheetSubmitted';
export { onGameMastered } from './triggers/onGameMastered';
export { onPaymentReceived } from './triggers/onPaymentReceived';

// Scheduled
export { sendClassReminders } from './scheduled/sendClassReminders';
export { checkNoShows } from './scheduled/checkNoShows';
export { updateSummaries } from './scheduled/updateSummaries';
export { sendWeeklyDigest } from './scheduled/sendWeeklyDigest';

// Callable
export { requestReschedule } from './callable/requestReschedule';
export { processPayment } from './callable/processPayment';
export { verifyManualPayment } from './callable/verifyManualPayment';
export { generateInvoice } from './callable/generateInvoice';
export { assignSubstitute } from './callable/assignSubstitute';
export { calculateEarnings } from './callable/calculateEarnings';
```

## Deployment Commands

```bash
# Build functions
cd functions && npm run build

# Deploy all functions
firebase deploy --only functions

# Deploy specific function
firebase deploy --only functions:onSessionCompleted

# Deploy multiple functions
firebase deploy --only functions:onSessionCompleted,onWorksheetSubmitted,sendClassReminders
```

## Environment Variables

```bash
# Set in Firebase
firebase functions:config:set \
  razorpay.key_id="rzp_live_xxx" \
  razorpay.key_secret="xxx" \
  sendgrid.api_key="SG.xxx" \
  twilio.account_sid="ACxxx" \
  twilio.auth_token="xxx" \
  whatsapp.api_key="xxx"

# Or use .env for local testing
# functions/.env.local
RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=xxx
SENDGRID_API_KEY=SG.xxx
TWILIO_ACCOUNT_SID=ACxxx
TWILIO_AUTH_TOKEN=xxx
```

## Testing

```bash
# Emulator suite
firebase emulators:start

# Test callable function locally
curl -X POST http://localhost:5001/tinysteps-react-v1/asia-south1/processPayment \
  -H "Content-Type: application/json" \
  -d '{"data":{"planId":"plan1","amount":1000,"method":"online"}}'
```

## Next Implementation Steps

1. ✅ Copy Firestore rules to production
2. Create missing trigger functions
3. Implement notification service (Email/SMS/WhatsApp)
4. Set up scheduled functions for reminders
5. Integrate payment gateway (Razorpay/Stripe)
6. Build audit logging utility
7. Create summary update helpers
8. Test with emulators before deploying

Ready to start implementing? Let me know which function to build first!
