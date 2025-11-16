import {onRequest} from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
import * as admin from 'firebase-admin';
import * as crypto from 'crypto';

if (!admin.apps.length) {
  admin.initializeApp();
}

const WEBHOOK_SECRET = process.env.PHONEPE_WEBHOOK_SECRET || 'your_webhook_secret_here';
const SALT_KEY = process.env.PHONEPE_SALT_KEY;

interface PhonePePayment {
  transactionId: string;
  merchantTransactionId: string;
  amount: number;
  state: string;
  responseCode: string;
}

interface PhonePeEvent {
  event: string;
  data: PhonePePayment;
}

export const webhookPhonePe = onRequest(
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

    const signature = req.headers['x-verify'] as string;
    const body = JSON.stringify(req.body);

    // Validate signature if webhook secret is provided
    if (WEBHOOK_SECRET && SALT_KEY) {
      const expectedSignature = crypto.createHmac('sha256', WEBHOOK_SECRET).update(body).digest('hex');
      if (signature !== expectedSignature) {
        logger.warn('Invalid PhonePe signature');
        res.status(401).send('Unauthorized');
        return;
      }
    }

    try {
      const event: PhonePeEvent = req.body;
      const { event: eventType, data: payment } = event;

      if (eventType === 'PAYMENT_SUCCESS' || payment.state === 'COMPLETED') {
        const { transactionId, merchantTransactionId, amount, state } = payment;

        // Extract invoiceId from merchantTransactionId (format: TXN_{invoiceId}_{timestamp})
        const parts = merchantTransactionId.split('_');
        if (parts.length < 3 || parts[0] !== 'TXN') {
          res.status(400).send('Invalid merchant transaction ID format');
          return;
        }
        const invoiceId = parts[1];

        // Idempotency key
        const idempotencyKey = `${transactionId}_${invoiceId}`;

        // Check if already processed
        const existingPayment = await admin.firestore()
          .collection('invoices')
          .doc(invoiceId)
          .collection('payments')
          .where('transactionId', '==', transactionId)
          .limit(1)
          .get();

        if (!existingPayment.empty) {
          logger.info(`Payment already processed: ${transactionId}`);
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
          amount: amount / 100, // Convert from paisa
          provider: 'phonepe',
          transactionId,
          merchantTransactionId,
          status: state.toLowerCase(),
          receivedAt: admin.firestore.FieldValue.serverTimestamp(),
          idempotencyKey
        });

        // Update invoice
        await admin.firestore().collection('invoices').doc(invoiceId).update({
          status: 'paid',
          paidDate: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedBy: 'phonepe_webhook'
        });

        // Get enrollment and update credits
        const invoiceDoc = await admin.firestore().collection('invoices').doc(invoiceId).get();
        const invoice = invoiceDoc.data();
        if (invoice?.enrollmentId) {
          const enrollmentRef = admin.firestore().collection('enrollments').doc(invoice.enrollmentId);
          const enrollmentDoc = await enrollmentRef.get();
          const enrollment = enrollmentDoc.data();
          if (enrollment) {
            const newCredits = enrollment.creditsTotal + (amount / 100);
            await enrollmentRef.update({
              creditsTotal: newCredits,
              status: 'active',
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
          }
        }

        logger.info(`Payment processed: invoiceId=${invoiceId}, amount=${amount}, txnId=${transactionId}`);
        res.status(200).json({ received: true });
      } else {
        res.status(200).json({ received: true });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Error in webhookPhonePe: ${errorMessage}`);
      res.status(500).send('Internal server error');
    }
  }
);