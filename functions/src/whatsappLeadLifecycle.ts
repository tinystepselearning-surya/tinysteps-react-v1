import * as admin from 'firebase-admin';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import * as logger from 'firebase-functions/logger';

if (!admin.apps.length) admin.initializeApp();

const REGION = 'asia-south1';
const PROVIDER = 'meta_whatsapp_cloud';

const text = (value: unknown, max = 500): string =>
  typeof value === 'string' ? value.trim().slice(0, max) : '';

const phoneDigits = (value: unknown): string => text(value, 80).replace(/[^\d]/g, '');

export const onUnmatchedWhatsAppInboundCreateLead = onDocumentCreated(
  { document: 'whatsappInboundUnmatched/{inboundId}', region: REGION },
  async (event) => {
    const inboundSnap = event.data;
    if (!inboundSnap) return;
    const inbound = inboundSnap.data() || {};
    const inboundId = text(event.params.inboundId, 160);
    const phoneNormalized = phoneDigits(inbound.phoneNormalized || inbound.rawFrom);
    const messageSummary = text(inbound.messageSummary, 500) || 'Inbound WhatsApp enquiry';
    const externalMessageId = text(inbound.externalMessageId, 300);

    if (!phoneNormalized) {
      logger.warn('Unable to convert unmatched WhatsApp message to lead: phone missing', { inboundId });
      return;
    }

    const db = admin.firestore();
    const leadId = `whatsapp_${phoneNormalized}`;
    const leadRef = db.collection('leads').doc(leadId);
    const communicationRef = leadRef.collection('communications').doc(`inbound_${inboundId}`);

    await db.runTransaction(async (tx) => {
      const [leadSnap, communicationSnap] = await Promise.all([
        tx.get(leadRef),
        tx.get(communicationRef),
      ]);

      if (!leadSnap.exists) {
        tx.set(leadRef, {
          parentName: null,
          primaryPhone: text(inbound.rawFrom, 80) || phoneNormalized,
          phoneNormalized,
          parentEmail: null,
          childName: null,
          childAge: null,
          childGrade: null,
          interestTrack: null,
          programInterest: null,
          source: 'whatsapp',
          sourceDetail: 'whatsapp_inbound',
          initialMessageSnippet: messageSummary,
          status: 'new',
          priority: 'normal',
          receivedAt: inbound.receivedAt || inbound.createdAt || admin.firestore.FieldValue.serverTimestamp(),
          requestedAt: inbound.receivedAt || inbound.createdAt || admin.firestore.FieldValue.serverTimestamp(),
          lastInboundAt: inbound.receivedAt || admin.firestore.FieldValue.serverTimestamp(),
          lastContactAt: inbound.receivedAt || admin.firestore.FieldValue.serverTimestamp(),
          createdAt: inbound.createdAt || inbound.receivedAt || admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          createdBy: null,
          updatedBy: null,
          lifecycleVersion: 2,
        });
      } else {
        tx.set(
          leadRef,
          {
            lastInboundAt: inbound.receivedAt || admin.firestore.FieldValue.serverTimestamp(),
            lastContactAt: inbound.receivedAt || admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
      }

      if (!communicationSnap.exists) {
        tx.set(communicationRef, {
          type: 'message',
          direction: 'inbound',
          channel: 'whatsapp',
          summary: messageSummary,
          followUpNeeded: false,
          followUpDate: null,
          templateTag: null,
          status: 'logged',
          provider: PROVIDER,
          externalMessageId: externalMessageId || null,
          deliveryStatus: 'sent',
          templateLanguage: null,
          templateName: null,
          errorCode: null,
          errorMessage: null,
          providerPayloadSummary: { source: 'unmatched_inbound_reconciler' },
          createdAt: inbound.receivedAt || inbound.createdAt || admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          createdBy: null,
          updatedBy: null,
        });
      }

      tx.set(
        inboundSnap.ref,
        {
          status: 'converted_to_lead',
          leadId,
          convertedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    });

    logger.info('Converted unmatched inbound WhatsApp message to lead', {
      inboundId,
      leadId,
      phoneNormalized,
    });
  },
);
