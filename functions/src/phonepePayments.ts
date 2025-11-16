import {onCall} from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import * as crypto from 'crypto';
import axios from 'axios';

if (!admin.apps.length) {
  admin.initializeApp();
}

const PHONEPE_API_URL = process.env.PHONEPE_API_URL || 'https://api.phonepe.com/apis/hermes';
const MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID;
const API_KEY = process.env.PHONEPE_API_KEY;
const SALT_KEY = process.env.PHONEPE_SALT_KEY;
const SALT_INDEX = process.env.PHONEPE_SALT_INDEX || '1';
const REDIRECT_URL = process.env.PHONEPE_REDIRECT_URL || 'http://localhost:5173/payments/callback';

function generateChecksum(payload: string): string {
  const data = payload + '/v3/transaction/sdk-less/initiate' + SALT_KEY;
  return crypto.createHash('sha256').update(data).digest('hex') + '###' + SALT_INDEX;
}

export const createPhonePeOrder = onCall(
  {
    region: "asia-south1",
    memory: "256MiB",
    timeoutSeconds: 60,
  },
  async (request) => {
    const { invoiceId, amount } = request.data;
    const uid = request.auth?.uid;

    if (!uid) {
      throw new Error('Unauthorized');
    }

    if (!invoiceId || !amount) {
      throw new Error('Missing required fields: invoiceId, amount');
    }

    if (!MERCHANT_ID || !API_KEY || !SALT_KEY) {
      throw new Error('PhonePe payment gateway is not yet configured. Please contact support or try again later.');
    }

    try {
      // Verify invoice belongs to user
      const invoiceDoc = await admin.firestore().collection('invoices').doc(invoiceId).get();
      if (!invoiceDoc.exists) {
        throw new Error('Invoice not found');
      }

      const invoice = invoiceDoc.data();
      if (invoice?.parentId !== uid) {
        throw new Error('Unauthorized access to invoice');
      }

      if (invoice?.status === 'paid') {
        throw new Error('Invoice already paid');
      }

      // Generate unique transaction ID
      const merchantTransactionId = `TXN_${invoiceId}_${Date.now()}`;

      // Prepare PhonePe payload
      const payload = {
        merchantId: MERCHANT_ID,
        merchantTransactionId,
        merchantUserId: uid,
        amount: amount * 100, // PhonePe expects amount in paisa
        redirectUrl: `${REDIRECT_URL}?invoiceId=${invoiceId}`,
        redirectMode: 'REDIRECT',
        callbackUrl: `${process.env.FIREBASE_FUNCTIONS_URL || 'https://asia-south1-tinysteps-react-v1.cloudfunctions.net'}/webhookPhonePe`,
        mobileNumber: invoice?.mobileNumber || '',
        paymentInstrument: {
          type: 'PAY_PAGE'
        }
      };

      const payloadString = JSON.stringify(payload);
      const checksum = generateChecksum(payloadString);

      // Make request to PhonePe
      const response = await axios.post(`${PHONEPE_API_URL}/v3/transaction/sdk-less/initiate`, {
        request: Buffer.from(payloadString).toString('base64')
      }, {
        headers: {
          'Content-Type': 'application/json',
          'X-VERIFY': checksum,
          'X-MERCHANT-ID': MERCHANT_ID
        }
      });

      const result = response.data;

      if (response.status !== 200 || !result.success) {
        throw new Error(`PhonePe API error: ${result.message || 'Unknown error'}`);
      }

      // Store transaction details
      await admin.firestore().collection('invoices').doc(invoiceId).update({
        phonepeTransactionId: merchantTransactionId,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      logger.info(`PhonePe order created: ${merchantTransactionId} for invoice ${invoiceId}`);

      return {
        merchantTransactionId,
        redirectUrl: result.data.instrumentResponse.redirectInfo.url,
        amount: payload.amount
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Error creating PhonePe order: ${errorMessage}`);
      throw new Error('Failed to create payment order');
    }
  }
);

export const verifyPhonePePayment = onCall(
  {
    region: "asia-south1",
    memory: "256MiB",
    timeoutSeconds: 60,
  },
  async (request) => {
    const { invoiceId, merchantTransactionId } = request.data;
    const uid = request.auth?.uid;

    if (!uid) {
      throw new Error('Unauthorized');
    }

    if (!invoiceId || !merchantTransactionId) {
      throw new Error('Missing required fields');
    }

    if (!MERCHANT_ID || !API_KEY || !SALT_KEY) {
      throw new Error('PhonePe payment gateway is not yet configured. Please contact support or try again later.');
    }

    try {
      // Verify invoice
      const invoiceDoc = await admin.firestore().collection('invoices').doc(invoiceId).get();
      if (!invoiceDoc.exists) {
        throw new Error('Invoice not found');
      }

      const invoice = invoiceDoc.data();
      if (invoice?.parentId !== uid) {
        throw new Error('Unauthorized access to invoice');
      }

      // Check PhonePe transaction status
      const statusPayload = {
        merchantId: MERCHANT_ID,
        merchantTransactionId
      };

      const statusPayloadString = JSON.stringify(statusPayload);
      const statusChecksum = crypto.createHash('sha256')
        .update(statusPayloadString + '/v3/transaction/' + MERCHANT_ID + '/' + merchantTransactionId + SALT_KEY)
        .digest('hex') + '###' + SALT_INDEX;

      const statusResponse = await axios.get(`${PHONEPE_API_URL}/v3/transaction/${MERCHANT_ID}/${merchantTransactionId}/status`, {
        headers: {
          'Content-Type': 'application/json',
          'X-VERIFY': statusChecksum,
          'X-MERCHANT-ID': MERCHANT_ID!
        }
      });

      const statusResult = statusResponse.data;

      if (statusResponse.status !== 200 || statusResult.success !== true) {
        throw new Error('Failed to verify payment status');
      }

      if (statusResult.data.state === 'COMPLETED') {
        // Update invoice and create payment record
        const paymentRef = admin.firestore()
          .collection('invoices')
          .doc(invoiceId)
          .collection('payments')
          .doc();

        await paymentRef.set({
          amount: statusResult.data.amount / 100, // Convert from paisa
          provider: 'phonepe',
          transactionId: statusResult.data.transactionId,
          merchantTransactionId,
          status: 'completed',
          receivedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        await admin.firestore().collection('invoices').doc(invoiceId).update({
          status: 'paid',
          paidDate: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedBy: uid,
        });

        logger.info(`Payment verified: ${merchantTransactionId} for invoice ${invoiceId}`);

        return { success: true, status: 'completed' };
      } else if (statusResult.data.state === 'FAILED') {
        return { success: false, status: 'failed' };
      } else {
        return { success: false, status: 'pending' };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Error verifying PhonePe payment: ${errorMessage}`);
      throw new Error('Payment verification failed');
    }
  }
);