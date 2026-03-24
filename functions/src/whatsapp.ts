import * as admin from 'firebase-admin';
import { defineSecret } from 'firebase-functions/params';
import { HttpsError, onCall, onRequest } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
import { ensureAdmin } from './helpers/adminGuard';

if (!admin.apps.length) {
  admin.initializeApp();
}

const REGION = 'asia-south1';
const PROVIDER = 'meta_whatsapp_cloud';
const LEADS_COLLECTION = 'leads';
const COMMUNICATIONS_SUBCOLLECTION = 'communications';
const UNMATCHED_INBOUND_COLLECTION = 'whatsappInboundUnmatched';

const WHATSAPP_PHONE_NUMBER_ID_SECRET = defineSecret('whatsapp-phone-number-id');
const WHATSAPP_ACCESS_TOKEN_SECRET = defineSecret('whatsapp-access-token');
const WHATSAPP_WEBHOOK_VERIFY_TOKEN_SECRET = defineSecret('whatsapp-webhook-verify-token');
const WHATSAPP_BUSINESS_ACCOUNT_ID_SECRET = defineSecret('whatsapp-business-account-id');

type CommunicationType = 'message' | 'call' | 'follow_up' | 'note';
type CommunicationDirection = 'inbound' | 'outbound' | 'internal';
type CommunicationChannel = 'whatsapp' | 'phone' | 'instagram' | 'website' | 'manual' | 'other';
type CommunicationStatus = 'logged' | 'pending_follow_up' | 'completed';
type DeliveryStatus = 'queued' | 'sent' | 'delivered' | 'read' | 'failed';

type TemplateKey =
  | 'first_response'
  | 'follow_up_no_response'
  | 'demo_scheduling'
  | 'demo_reminder'
  | 'demo_completed_followup'
  | 'admission_followup';

interface LeadDoc {
  parentName?: string;
  primaryPhone?: string;
  phoneNormalized?: string;
}

interface TemplateDefinition {
  templateName: string;
  defaultLanguage: string;
}

interface SendTemplateMessageInput {
  leadId?: string;
  templateKey?: TemplateKey;
  templateParams?: unknown;
  communicationId?: string;
  previewOnly?: boolean;
}

interface WhatsAppRuntimeConfig {
  phoneNumberId: string;
  accessToken: string;
  businessAccountId: string | null;
  defaultTemplateLanguage: string;
}

const SUPPORTED_TEMPLATES: Record<TemplateKey, TemplateDefinition> = {
  first_response: {
    templateName: 'first_response',
    defaultLanguage: 'en',
  },
  follow_up_no_response: {
    templateName: 'follow_up_no_response',
    defaultLanguage: 'en',
  },
  demo_scheduling: {
    templateName: 'demo_scheduling',
    defaultLanguage: 'en',
  },
  demo_reminder: {
    templateName: 'demo_reminder',
    defaultLanguage: 'en',
  },
  demo_completed_followup: {
    templateName: 'demo_completed_followup',
    defaultLanguage: 'en',
  },
  admission_followup: {
    templateName: 'admission_followup',
    defaultLanguage: 'en',
  },
};

const normalizePhone = (value: unknown): string => String(value || '').replace(/[^\d]/g, '');

const trimText = (value: unknown): string => String(value || '').trim();

const safeSummary = (value: unknown, fallback = 'WhatsApp message'): string => {
  const text = trimText(value);
  if (!text) return fallback;
  return text.length > 500 ? `${text.slice(0, 497)}...` : text;
};

const getDefaultTemplateLanguage = (): string => {
  const fromEnv = trimText(process.env.WHATSAPP_DEFAULT_TEMPLATE_LANGUAGE);
  return fromEnv || 'en';
};

const readWebhookVerifyToken = (): string => {
  const verifyToken = trimText(WHATSAPP_WEBHOOK_VERIFY_TOKEN_SECRET.value());
  if (!verifyToken) {
    throw new HttpsError(
      'failed-precondition',
      "Secret 'whatsapp-webhook-verify-token' is not configured.",
    );
  }
  return verifyToken;
};

const readWhatsAppSendConfig = (): WhatsAppRuntimeConfig => {
  const phoneNumberId = trimText(WHATSAPP_PHONE_NUMBER_ID_SECRET.value());
  const accessToken = trimText(WHATSAPP_ACCESS_TOKEN_SECRET.value());
  const businessAccountIdRaw = trimText(WHATSAPP_BUSINESS_ACCOUNT_ID_SECRET.value());

  if (!phoneNumberId) {
    throw new HttpsError(
      'failed-precondition',
      "Secret 'whatsapp-phone-number-id' is not configured.",
    );
  }
  if (!accessToken) {
    throw new HttpsError(
      'failed-precondition',
      "Secret 'whatsapp-access-token' is not configured.",
    );
  }
  return {
    phoneNumberId,
    accessToken,
    businessAccountId: businessAccountIdRaw || null,
    defaultTemplateLanguage: getDefaultTemplateLanguage(),
  };
};

const isTemplateKey = (value: unknown): value is TemplateKey => {
  if (typeof value !== 'string') return false;
  return Object.prototype.hasOwnProperty.call(SUPPORTED_TEMPLATES, value);
};

const parseTemplateParams = (value: unknown): string[] => {
  if (value == null) return [];
  if (!Array.isArray(value)) {
    throw new HttpsError('invalid-argument', 'templateParams must be an array of strings');
  }

  const params = value
    .map((item) => trimText(item))
    .filter(Boolean)
    .map((item) => (item.length > 200 ? `${item.slice(0, 197)}...` : item));

  if (params.length > 20) {
    throw new HttpsError('invalid-argument', 'templateParams supports up to 20 text values');
  }

  return params;
};

const mapMetaStatus = (value: unknown): DeliveryStatus => {
  const normalized = trimText(value).toLowerCase();
  if (normalized === 'sent') return 'sent';
  if (normalized === 'delivered') return 'delivered';
  if (normalized === 'read') return 'read';
  if (normalized === 'failed') return 'failed';
  return 'queued';
};

const buildPhoneCandidates = (raw: string): string[] => {
  const normalized = normalizePhone(raw);
  if (!normalized) return [];
  const candidates = new Set<string>([normalized]);
  if (normalized.length > 10) {
    candidates.add(normalized.slice(-10));
  }
  return Array.from(candidates).filter((item) => item.length >= 8);
};

const findLeadByPhone = async (
  db: FirebaseFirestore.Firestore,
  rawPhone: string,
): Promise<FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData> | null> => {
  const candidates = buildPhoneCandidates(rawPhone);
  if (candidates.length === 0) return null;

  if (candidates.length === 1) {
    const snap = await db
      .collection(LEADS_COLLECTION)
      .where('phoneNormalized', '==', candidates[0])
      .limit(1)
      .get();
    return snap.empty ? null : snap.docs[0];
  }

  const snap = await db
    .collection(LEADS_COLLECTION)
    .where('phoneNormalized', 'in', candidates.slice(0, 10))
    .limit(1)
    .get();
  return snap.empty ? null : snap.docs[0];
};

const parseMetaApiError = (payload: any): { code: string | null; message: string | null } => {
  const errorObj = payload?.error;
  if (!errorObj || typeof errorObj !== 'object') {
    return { code: null, message: null };
  }

  const code = trimText(errorObj.code || errorObj.error_subcode || '').slice(0, 120);
  const message = safeSummary(errorObj.message, 'Failed to send WhatsApp template').slice(0, 500);

  return {
    code: code || null,
    message: message || null,
  };
};

const extractMessageSummary = (message: any): string => {
  const textBody = trimText(message?.text?.body);
  if (textBody) return safeSummary(textBody, 'Inbound WhatsApp message');

  const messageType = trimText(message?.type).toLowerCase();
  if (messageType === 'image') return 'Inbound WhatsApp image message';
  if (messageType === 'audio') return 'Inbound WhatsApp audio message';
  if (messageType === 'video') return 'Inbound WhatsApp video message';
  if (messageType === 'document') return 'Inbound WhatsApp document message';
  if (messageType === 'button') return 'Inbound WhatsApp button response';
  if (messageType === 'interactive') return 'Inbound WhatsApp interactive message';

  return 'Inbound WhatsApp message';
};

const buildTemplateComponents = (templateParams: string[]): Array<{ type: string; parameters: Array<{ type: string; text: string }> }> | undefined => {
  if (templateParams.length === 0) return undefined;

  return [
    {
      type: 'body',
      parameters: templateParams.map((text) => ({
        type: 'text',
        text,
      })),
    },
  ];
};

const findExistingCommunicationByExternalId = async (
  db: FirebaseFirestore.Firestore,
  leadId: string,
  externalMessageId: string,
): Promise<FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData> | null> => {
  const snap = await db
    .collection(LEADS_COLLECTION)
    .doc(leadId)
    .collection(COMMUNICATIONS_SUBCOLLECTION)
    .where('externalMessageId', '==', externalMessageId)
    .limit(1)
    .get();

  return snap.empty ? null : snap.docs[0];
};

export const sendWhatsAppTemplateMessage = onCall(
  {
    region: REGION,
    timeoutSeconds: 60,
    memory: '256MiB',
    secrets: [
      WHATSAPP_PHONE_NUMBER_ID_SECRET,
      WHATSAPP_ACCESS_TOKEN_SECRET,
      WHATSAPP_WEBHOOK_VERIFY_TOKEN_SECRET,
      WHATSAPP_BUSINESS_ACCOUNT_ID_SECRET,
    ],
  },
  async (request) => {
    await ensureAdmin(request.auth);

    const input = (request.data || {}) as SendTemplateMessageInput;
    const leadId = trimText(input.leadId);
    const communicationId = trimText(input.communicationId) || null;
    const previewOnly = input.previewOnly === true;

    if (!leadId) {
      throw new HttpsError('invalid-argument', 'leadId is required');
    }
    if (!isTemplateKey(input.templateKey)) {
      throw new HttpsError('invalid-argument', 'templateKey is invalid or not supported');
    }

    const db = admin.firestore();
    const leadRef = db.collection(LEADS_COLLECTION).doc(leadId);
    const leadSnap = await leadRef.get();
    if (!leadSnap.exists) {
      throw new HttpsError('not-found', 'Lead not found');
    }

    const lead = leadSnap.data() as LeadDoc;
    const phone = normalizePhone(lead.phoneNormalized || lead.primaryPhone || '');
    if (phone.length < 8) {
      throw new HttpsError('invalid-argument', 'Lead does not have a usable phone number');
    }

    const templateMeta = SUPPORTED_TEMPLATES[input.templateKey];
    const templateParams = parseTemplateParams(input.templateParams);
    const uid = request.auth?.uid || null;

    const config = readWhatsAppSendConfig();
    const templateLanguage = templateMeta.defaultLanguage || config.defaultTemplateLanguage;
    const templateComponents = buildTemplateComponents(templateParams);

    if (previewOnly) {
      return {
        ok: true,
        previewOnly: true,
        leadId,
        phone,
        templateKey: input.templateKey,
        templateName: templateMeta.templateName,
        templateLanguage,
        businessAccountConfigured: Boolean(config.businessAccountId),
      };
    }

    const bodyPayload: Record<string, unknown> = {
      messaging_product: 'whatsapp',
      to: phone,
      type: 'template',
      template: {
        name: templateMeta.templateName,
        language: {
          code: templateLanguage,
        },
        ...(templateComponents ? { components: templateComponents } : {}),
      },
    };

    const endpoint = `https://graph.facebook.com/v22.0/${config.phoneNumberId}/messages`;
    let externalMessageId: string | null = null;
    let deliveryStatus: DeliveryStatus = 'failed';
    let errorCode: string | null = null;
    let errorMessage: string | null = null;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bodyPayload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const responseJson = (await response.json().catch(() => ({}))) as any;
      if (!response.ok) {
        const parsedError = parseMetaApiError(responseJson);
        errorCode = parsedError.code;
        errorMessage = parsedError.message;
        throw new HttpsError(
          'internal',
          errorMessage || 'WhatsApp API send failed',
        );
      }

      externalMessageId = trimText(responseJson?.messages?.[0]?.id) || null;
      deliveryStatus = 'queued';
    } catch (error: any) {
      if (!errorCode || !errorMessage) {
        errorCode = trimText(error?.code || 'send_failed').slice(0, 120) || 'send_failed';
        errorMessage = safeSummary(error?.message || 'WhatsApp send failed', 'WhatsApp send failed');
      }
      deliveryStatus = 'failed';
    }

    const communicationPayload: Record<string, unknown> = {
      type: 'message' as CommunicationType,
      direction: 'outbound' as CommunicationDirection,
      channel: 'whatsapp' as CommunicationChannel,
      summary: `Template send: ${templateMeta.templateName}`,
      followUpNeeded: false,
      followUpDate: null,
      templateTag: input.templateKey,
      status: 'logged' as CommunicationStatus,
      templateName: templateMeta.templateName,
      templateLanguage,
      provider: PROVIDER,
      externalMessageId,
      deliveryStatus,
      errorCode,
      errorMessage,
      providerPayloadSummary: {
        templateKey: input.templateKey,
        templateParamCount: templateParams.length,
        hasBusinessAccountId: Boolean(config.businessAccountId),
      },
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: uid,
    };

    let finalCommunicationId = communicationId;
    if (communicationId) {
      const communicationRef = leadRef.collection(COMMUNICATIONS_SUBCOLLECTION).doc(communicationId);
      const existing = await communicationRef.get();
      if (existing.exists) {
        await communicationRef.update(communicationPayload);
      } else {
        await communicationRef.set({
          ...communicationPayload,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          createdBy: uid,
        });
      }
    } else {
      const createdRef = await leadRef.collection(COMMUNICATIONS_SUBCOLLECTION).add({
        ...communicationPayload,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: uid,
      });
      finalCommunicationId = createdRef.id;
    }

    if (deliveryStatus !== 'failed') {
      await leadRef.update({
        lastContactAt: admin.firestore.FieldValue.serverTimestamp(),
        lastOutboundAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: uid,
      });
    }

    if (deliveryStatus === 'failed') {
      throw new HttpsError('internal', errorMessage || 'WhatsApp send failed');
    }

    return {
      ok: true,
      leadId,
      communicationId: finalCommunicationId,
      externalMessageId,
      deliveryStatus,
    };
  },
);

const processInboundMessage = async (
  db: FirebaseFirestore.Firestore,
  message: any,
): Promise<'matched' | 'unmatched' | 'skipped'> => {
  const rawFrom = trimText(message?.from);
  const externalMessageId = trimText(message?.id);
  const phoneNormalized = normalizePhone(rawFrom);
  const messageSummary = extractMessageSummary(message);

  if (!rawFrom || !phoneNormalized || !externalMessageId) {
    return 'skipped';
  }

  const matchedLead = await findLeadByPhone(db, rawFrom);
  if (!matchedLead) {
    await db.collection(UNMATCHED_INBOUND_COLLECTION).add({
      phoneNormalized,
      rawFrom,
      messageSummary,
      externalMessageId,
      provider: PROVIDER,
      status: 'unmatched',
      receivedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return 'unmatched';
  }

  const leadId = matchedLead.id;
  const leadRef = db.collection(LEADS_COLLECTION).doc(leadId);

  const existingCommunication = await findExistingCommunicationByExternalId(
    db,
    leadId,
    externalMessageId,
  );

  if (!existingCommunication) {
    await leadRef.collection(COMMUNICATIONS_SUBCOLLECTION).add({
      type: 'message' as CommunicationType,
      direction: 'inbound' as CommunicationDirection,
      channel: 'whatsapp' as CommunicationChannel,
      summary: messageSummary,
      followUpNeeded: false,
      followUpDate: null,
      templateTag: null,
      status: 'logged' as CommunicationStatus,
      provider: PROVIDER,
      externalMessageId,
      deliveryStatus: 'sent' as DeliveryStatus,
      templateLanguage: null,
      templateName: null,
      errorCode: null,
      errorMessage: null,
      providerPayloadSummary: {
        messageType: trimText(message?.type) || 'unknown',
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: null,
      updatedBy: null,
    });
  }

  await leadRef.update({
    lastInboundAt: admin.firestore.FieldValue.serverTimestamp(),
    lastContactAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return 'matched';
};

const processStatusUpdate = async (
  db: FirebaseFirestore.Firestore,
  statusEvent: any,
): Promise<number> => {
  const externalMessageId = trimText(statusEvent?.id);
  if (!externalMessageId) return 0;

  const deliveryStatus = mapMetaStatus(statusEvent?.status);
  const firstError = Array.isArray(statusEvent?.errors) ? statusEvent.errors[0] : null;
  const errorCode = trimText(firstError?.code || '').slice(0, 120) || null;
  const errorMessage = safeSummary(firstError?.title || firstError?.message || '', '').slice(0, 500) || null;

  const communicationMatches = await db
    .collectionGroup(COMMUNICATIONS_SUBCOLLECTION)
    .where('externalMessageId', '==', externalMessageId)
    .get();

  if (communicationMatches.empty) {
    return 0;
  }

  const batch = db.batch();
  communicationMatches.docs.forEach((docSnap) => {
    batch.update(docSnap.ref, {
      deliveryStatus,
      errorCode,
      errorMessage,
      provider: PROVIDER,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });

  await batch.commit();
  return communicationMatches.size;
};

export const whatsAppWebhook = onRequest(
  {
    region: REGION,
    timeoutSeconds: 60,
    memory: '256MiB',
    secrets: [WHATSAPP_WEBHOOK_VERIFY_TOKEN_SECRET],
  },
  async (request, response) => {
    const method = request.method.toUpperCase();

    if (method === 'GET') {
      let verifyTokenExpected: string;
      try {
        verifyTokenExpected = readWebhookVerifyToken();
      } catch (error: any) {
        logger.error('[whatsAppWebhook] config missing for verification', { error: String(error) });
        response.status(500).send('Webhook config missing');
        return;
      }

      const mode = trimText(request.query['hub.mode']);
      const challenge = trimText(request.query['hub.challenge']);
      const verifyToken = trimText(request.query['hub.verify_token']);

      if (mode === 'subscribe' && verifyToken === verifyTokenExpected && challenge) {
        response.status(200).send(challenge);
        return;
      }

      response.status(403).send('Verification failed');
      return;
    }

    if (method !== 'POST') {
      response.status(405).json({ ok: false, error: 'Method not allowed' });
      return;
    }

    const db = admin.firestore();
    const body = request.body as any;
    const entries = Array.isArray(body?.entry) ? body.entry : [];

    let inboundMatched = 0;
    let inboundUnmatched = 0;
    let statusesUpdated = 0;

    try {
      for (const entry of entries) {
        const changes = Array.isArray(entry?.changes) ? entry.changes : [];
        for (const change of changes) {
          const value = change?.value || {};

          const messages = Array.isArray(value?.messages) ? value.messages : [];
          for (const message of messages) {
            const result = await processInboundMessage(db, message);
            if (result === 'matched') inboundMatched += 1;
            if (result === 'unmatched') inboundUnmatched += 1;
          }

          const statuses = Array.isArray(value?.statuses) ? value.statuses : [];
          for (const statusEvent of statuses) {
            statusesUpdated += await processStatusUpdate(db, statusEvent);
          }
        }
      }

      response.status(200).json({
        ok: true,
        inboundMatched,
        inboundUnmatched,
        statusesUpdated,
      });
    } catch (error: any) {
      logger.error('[whatsAppWebhook] processing failed', {
        error: String(error),
        inboundMatched,
        inboundUnmatched,
        statusesUpdated,
      });

      response.status(200).json({
        ok: true,
        inboundMatched,
        inboundUnmatched,
        statusesUpdated,
      });
    }
  },
);
