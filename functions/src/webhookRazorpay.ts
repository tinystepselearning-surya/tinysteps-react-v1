import {onRequest} from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
import * as admin from 'firebase-admin';
import * as crypto from 'crypto';

if (!admin.apps.length) {
  admin.initializeApp();
}

const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || 'your_webhook_secret_here';

interface RazorpayPayment {
  id: string;
  amount: number;
  status: string;
  notes: { invoiceId: string };
}

interface RazorpayEvent {
  event: string;
  entity: RazorpayPayment;
}

export const webhookRazorpay = onRequest(
  {
    region: "asia-south1",
    memory: "256MiB",
    timeoutSeconds: 60,
  },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).send('Method not allowed');
      return;
    }

    const signature = req.headers['x-razorpay-signature'] as string;
    const body = JSON.stringify(req.body);

    // Validate signature
    const expectedSignature = crypto.createHmac('sha256', WEBHOOK_SECRET).update(body).digest('hex');
    if (signature !== expectedSignature) {
      logger.warn('Invalid Razorpay signature');
      res.status(401).send('Unauthorized');
      return;
    }

    try {
      const event: RazorpayEvent = req.body;
      const { event: eventType, entity: payment } = event;

      if (eventType === 'payment.authorized') {
        const { id: paymentId, amount, status, notes } = payment;
        const { invoiceId } = notes;

        if (!invoiceId) {
          res.status(400).send('Missing invoiceId');
          return;
        }

        // Idempotency key
        const idempotencyKey = `${paymentId}_${invoiceId}`;

        // Check if already processed
        const existingPayment = await admin.firestore()
          .collection('invoices')
          .doc(invoiceId)
          .collection('payments')
          .where('transactionId', '==', paymentId)
          .limit(1)
          .get();

        if (!existingPayment.empty) {
          logger.info(`Payment already processed: ${paymentId}`);
          res.status(200).json({ received: true });
          return;
        }

        // Write payment record
        const paymentRef = admin.firestore()
          .collection('invoices')
          .doc(invoiceId)
          .collection('payments')
          .doc();

        await paymentRef.set({
          amount,
          provider: 'razorpay',
          transactionId: paymentId,
          status,
          receivedAt: admin.firestore.FieldValue.serverTimestamp(),
          idempotencyKey
        });

        // Update invoice
        await admin.firestore().collection('invoices').doc(invoiceId).update({
          status: 'paid',
          paidDate: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedBy: 'razorpay_webhook'
        });

        // Get enrollment and update credits
        const invoiceDoc = await admin.firestore().collection('invoices').doc(invoiceId).get();
        const invoice = invoiceDoc.data();
        if (invoice?.enrollmentId) {
          const enrollmentRef = admin.firestore().collection('enrollments').doc(invoice.enrollmentId);
          const enrollmentDoc = await enrollmentRef.get();
          const enrollment = enrollmentDoc.data();
          if (enrollment) {
            const newCredits = enrollment.creditsTotal + (amount / 100); // Assuming amount in paise
            await enrollmentRef.update({
              creditsTotal: newCredits,
              status: 'active',
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
          }
        }

        logger.info(`Payment processed: invoiceId=${invoiceId}, amount=${amount}, txnId=${paymentId}`);
        res.status(200).json({ received: true });
      } else {
        res.status(200).json({ received: true });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Error in webhookRazorpay: ${errorMessage}`);
      res.status(500).send('Internal server error');
    }
  }
);