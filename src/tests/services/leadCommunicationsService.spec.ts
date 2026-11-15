import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  addDoc: vi.fn(),
  getDocs: vi.fn(),
  collection: vi.fn(() => ({ kind: 'communications-collection' })),
  serverTimestamp: vi.fn(() => ({ kind: 'server-timestamp' })),
}));

vi.mock('../../lib/firebaseConfig', () => ({ db: {}, auth: { currentUser: { uid: 'staff-admin-test' } } }));

vi.mock('firebase/firestore', () => ({
  addDoc: mocks.addDoc,
  collection: mocks.collection,
  serverTimestamp: mocks.serverTimestamp,
  getDocs: mocks.getDocs,
  limit: vi.fn(),
  orderBy: vi.fn(),
  query: vi.fn(),
}));

import { addLeadCommunication, customStaffWhatsAppUrl, fetchLeadCommunications, recentLeadContactEvidence, leadContactOutcomeOptions } from '../../services/leadCommunicationsService';

describe('Staff-recorded lead communication evidence', () => {
  beforeEach(() => {
    mocks.addDoc.mockReset().mockResolvedValue({ id: 'communication-1' });
    mocks.getDocs.mockReset();
    mocks.collection.mockClear();
  });

  it('preserves an explicitly recorded inbound parent response', async () => {
    const recorded = await addLeadCommunication({
      leadId: 'existing-lead',
      type: 'message',
      channel: 'whatsapp',
      direction: 'inbound',
      summary: 'Parent replied about assessment times',
    });

    expect(mocks.addDoc).toHaveBeenCalledTimes(1);
    expect(mocks.collection).toHaveBeenCalledWith({}, 'leads', 'existing-lead', 'communications');
    expect(mocks.addDoc.mock.calls[0][1]).toEqual(expect.objectContaining({
      type: 'message',
      channel: 'whatsapp',
      direction: 'inbound',
      summary: 'Parent replied about assessment times',
      status: 'logged',
    }));
    expect(recorded.direction).toBe('inbound');
  });

  it('preserves outbound direction for existing callers when omitted', async () => {
    const recorded = await addLeadCommunication({
      leadId: 'existing-lead',
      type: 'call',
      channel: 'phone',
      summary: 'Staff placed a call',
    });

    expect(mocks.addDoc.mock.calls[0][1].direction).toBe('outbound');
    expect(recorded.direction).toBe('outbound');
  });

  it('cannot misclassify an internal note as a parent contact', async () => {
    const recorded = await addLeadCommunication({
      leadId: 'existing-lead',
      type: 'note',
      channel: 'internal',
      direction: 'inbound',
      summary: 'Internal scheduling discussion',
    });

    expect(mocks.addDoc.mock.calls[0][1].direction).toBe('internal');
    expect(recorded.direction).toBe('internal');
  });

  it('saves a staff-confirmed conversation as an explicit outcome', async () => {
    const recorded = await addLeadCommunication({
      leadId: 'existing-lead',
      type: 'call', channel: 'phone', direction: 'outbound',
      outcome: 'spoke_to_parent', summary: 'Parent agreed to consider available slots',
    });
    expect(mocks.addDoc.mock.calls[0][1]).toMatchObject({
      direction: 'outbound', outcome: 'spoke_to_parent',
    });
    expect(recorded.outcome).toBe('spoke_to_parent');
    expect(recorded.createdBy).toBe('staff-admin-test');
    expect(mocks.addDoc.mock.calls[0][1].createdBy).toBe('staff-admin-test');
    expect(recentLeadContactEvidence([recorded])).toMatch(/Spoke with parent/);
  });

  it('keeps outbound messaging unverified and forbids false parent-reply outcomes', async () => {
    const outbound = await addLeadCommunication({
      leadId: 'existing-lead', type: 'message', channel: 'whatsapp',
      direction: 'outbound', outcome: 'message_sent_unconfirmed',
      summary: 'Staff reports sending a WhatsApp message',
    });
    expect(recentLeadContactEvidence([outbound])).toMatch(/delivery unverified/);
    await expect(addLeadCommunication({
      leadId: 'existing-lead', type: 'message', channel: 'whatsapp',
      direction: 'outbound', outcome: 'parent_replied',
      summary: 'Not a valid outbound result',
    })).rejects.toThrow(/does not match/);
    expect(mocks.addDoc).toHaveBeenCalledTimes(1);
  });

  it('allows response evidence only for compatible inbound interactions', async () => {
    expect(leadContactOutcomeOptions('message', 'inbound').map((item) => item.value))
      .toEqual(['parent_replied']);
    expect(leadContactOutcomeOptions('call', 'outbound').map((item) => item.value))
      .toEqual(['spoke_to_parent', 'attempted_no_answer', 'invalid_contact']);
    expect(leadContactOutcomeOptions('note', 'internal')).toEqual([]);
    await expect(addLeadCommunication({
      leadId: 'existing-lead', type: 'note', channel: 'internal',
      direction: 'inbound', outcome: 'spoke_to_parent',
      summary: 'Internal note cannot prove contact',
    })).rejects.toThrow(/does not match/);
    expect(mocks.addDoc).not.toHaveBeenCalled();
  });

  it('shows the latest explicit result without reinterpreting older unstructured records', () => {
    const base = {
      id: 'test', type: 'call' as const, channel: 'phone' as const,
      direction: 'outbound' as const, summary: 'Note', createdAtMs: 1700000000000,
    };
    expect(recentLeadContactEvidence([{ ...base, outcome: 'attempted_no_answer' }]))
      .toMatch(/No answer/);
    expect(recentLeadContactEvidence([{ ...base, outcome: null }]))
      .toMatch(/no parent response confirmed/i);
    expect(recentLeadContactEvidence([])).toMatch(/No contact result recorded/);
  });

  it('records a pricing objection separately from the contact result', async () => {
    const record = await addLeadCommunication({
      leadId: 'existing-lead',
      type: 'call', channel: 'phone', direction: 'outbound',
      outcome: 'spoke_to_parent', parentConcern: 'price_too_high',
      summary: 'Parent said the course fee feels too high. Discussed class options.',
    });
    expect(mocks.addDoc.mock.calls[0][1]).toMatchObject({
      outcome: 'spoke_to_parent', parentConcern: 'price_too_high',
    });
    expect(record.parentConcern).toBe('price_too_high');
    expect(mocks.addDoc.mock.calls[0][1]).not.toHaveProperty('conversionStatus');
  });

  it('does not claim a pricing objection from an unconfirmed message or unanswered call', async () => {
    await expect(addLeadCommunication({
      leadId: 'existing-lead', type: 'message', channel: 'whatsapp',
      direction: 'outbound', outcome: 'message_sent_unconfirmed',
      parentConcern: 'price_too_high', summary: 'Only sent a message',
    })).rejects.toThrow('requires a conversation');
    await expect(addLeadCommunication({
      leadId: 'existing-lead', type: 'call', channel: 'phone',
      outcome: 'attempted_no_answer', parentConcern: 'price_too_high',
      summary: 'No answer',
    })).rejects.toThrow('requires a conversation');
    expect(mocks.addDoc).not.toHaveBeenCalled();
  });

  it('keeps a custom WhatsApp draft manual, properly encoded and without writing a lead log', () => {
    const url = customStaffWhatsAppUrl('+91 96660 95553', 'Hello, may we discuss class options & fees?');
    expect(url).toBe('https://wa.me/919666095553?text=Hello%2C%20may%20we%20discuss%20class%20options%20%26%20fees%3F');
    expect(customStaffWhatsAppUrl('+919666095553', '  ')).toBeNull();
    expect(customStaffWhatsAppUrl('123', 'Hello')).toBeNull();
    expect(customStaffWhatsAppUrl('+919666095553', 'x'.repeat(1501))).toBeNull();
    expect(mocks.addDoc).not.toHaveBeenCalled();
  });

  it('preserves the concern tag in recent communications without backfilling legacy records', async () => {
    mocks.getDocs.mockResolvedValue({ docs: [
      { id: 'priced', data: () => ({
        type: 'call', channel: 'phone', direction: 'outbound',
        outcome: 'spoke_to_parent', parentConcern: 'price_too_high',
        summary: 'Too expensive',
      }) },
      { id: 'legacy', data: () => ({
        type: 'note', channel: 'internal', summary: 'Older entry',
      }) },
    ] });
    const records = await fetchLeadCommunications('existing-lead');
    expect(records.map((row) => row.parentConcern)).toEqual(['price_too_high', null]);
  });

  it('refuses empty summaries without writing a contact event', async () => {
    await expect(addLeadCommunication({
      leadId: 'existing-lead',
      type: 'message',
      channel: 'whatsapp',
      direction: 'inbound',
      summary: '    ',
    })).rejects.toThrow('Communication summary is required.');
    expect(mocks.addDoc).not.toHaveBeenCalled();
  });

  it('does not invent a direction for historical records missing that field', async () => {
    mocks.getDocs.mockResolvedValue({
      docs: [
        { id: 'legacy-contact', data: () => ({
          type: 'message', channel: 'whatsapp',
          summary: 'Historical contact without recorded direction',
        }) },
        { id: 'parent-reply', data: () => ({
          type: 'message', channel: 'whatsapp', direction: 'inbound',
          summary: 'Parent replied to the invitation',
        }) },
      ],
    });

    const records = await fetchLeadCommunications('existing-lead');

    expect(records.map((row) => row.direction)).toEqual(['unknown', 'inbound']);
    expect(mocks.addDoc).not.toHaveBeenCalled();
  });

});
