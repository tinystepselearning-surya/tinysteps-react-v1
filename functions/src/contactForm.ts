import { onRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';

if (!admin.apps.length) admin.initializeApp();

const REGION = 'asia-south1';
const SUPPORT_EMAIL = 'Priya@tinystepslearning.com';
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type ContactPayload = {
  name?: string;
  email?: string;
  phone?: string;
  message?: string;
  topic?: string;
  pagePath?: string;
  submittedAt?: string;
};

function setCorsHeaders(response: any) {
  response.set('Access-Control-Allow-Origin', '*');
  response.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.set('Access-Control-Allow-Headers', 'Content-Type');
}

function sanitize(value: unknown) {
  return String(value || '').trim();
}

function validatePayload(payload: ContactPayload) {
  const name = sanitize(payload.name);
  const email = sanitize(payload.email).toLowerCase();
  const phone = sanitize(payload.phone);
  const message = sanitize(payload.message);
  const topic = sanitize(payload.topic) || 'General inquiry';
  const pagePath = sanitize(payload.pagePath) || '/contact';

  if (name.length < 2) {
    throw new Error('A valid name is required');
  }
  if (!EMAIL_REGEX.test(email)) {
    throw new Error('A valid email is required');
  }
  if (phone.length < 7) {
    throw new Error('A valid phone number is required');
  }
  if (message.length < 5) {
    throw new Error('A message is required');
  }

  return {
    name,
    email,
    phone,
    message,
    topic,
    pagePath,
    submittedAt: sanitize(payload.submittedAt),
  };
}

function buildEmailText(payload: ReturnType<typeof validatePayload>) {
  return [
    'New Tiny Steps contact form submission',
    '',
    `Topic: ${payload.topic}`,
    `Name: ${payload.name}`,
    `Email: ${payload.email}`,
    `Phone: ${payload.phone}`,
    `Page: ${payload.pagePath}`,
    '',
    'Message:',
    payload.message,
  ].join('\n');
}

export const contactForm = onRequest({region: REGION}, async (request, response) => {
  setCorsHeaders(response);

  if (request.method === 'OPTIONS') {
    response.status(204).send('');
    return;
  }

  if (request.method !== 'POST') {
    response.status(405).json({ok: false, error: 'Method not allowed'});
    return;
  }

  try {
    const payload = validatePayload((request.body || {}) as ContactPayload);
    const db = admin.firestore();
    const createdAt = admin.firestore.FieldValue.serverTimestamp();

    const record = {
      ...payload,
      submittedAt: payload.submittedAt || new Date().toISOString(),
      createdAt,
      userAgent: sanitize(request.get('user-agent')),
      ipAddress: sanitize(request.ip || request.get('x-forwarded-for')),
      status: 'new',
    };

    const submissionRef = await db.collection('contactSubmissions').add(record);

    // Queue an email for the support inbox. This works with the Firebase Trigger Email extension
    // or any backend process that watches the "mail" collection.
    await db.collection('mail').add({
      to: [SUPPORT_EMAIL],
      message: {
        subject: `New Tiny Steps contact request from ${payload.name}`,
        text: buildEmailText(payload),
        html: `
          <p><strong>New Tiny Steps contact form submission</strong></p>
          <p><strong>Topic:</strong> ${payload.topic}</p>
          <p><strong>Name:</strong> ${payload.name}</p>
          <p><strong>Email:</strong> ${payload.email}</p>
          <p><strong>Phone:</strong> ${payload.phone}</p>
          <p><strong>Page:</strong> ${payload.pagePath}</p>
          <p><strong>Message:</strong><br/>${payload.message.replace(/\n/g, '<br/>')}</p>
        `,
      },
      meta: {
        contactSubmissionId: submissionRef.id,
        topic: payload.topic,
        pagePath: payload.pagePath,
      },
      createdAt,
    });

    logger.info('[contactForm] stored contact submission', {
      submissionId: submissionRef.id,
      topic: payload.topic,
      pagePath: payload.pagePath,
    });

    response.status(200).json({
      ok: true,
      submissionId: submissionRef.id,
      message: 'Thank you! We’ll get back to you soon.',
    });
  } catch (error: any) {
    logger.error('[contactForm] failed to handle submission', error);
    response.status(400).json({
      ok: false,
      error: error?.message || 'Unable to process request',
    });
  }
});
