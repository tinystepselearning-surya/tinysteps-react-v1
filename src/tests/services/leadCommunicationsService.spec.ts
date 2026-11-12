import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  addDoc: vi.fn(),
  collection: vi.fn(() => ({ kind: 'communications-collection' })),
  serverTimestamp: vi.fn(() => ({ kind: 'server-timestamp' })),
}));

vi.mock('../../lib/firebaseConfig', () => ({ db: {} }));

vi.mock('firebase/firestore', () => ({
  addDoc: mocks.addDoc,
  collection: mocks.collection,
  serverTimestamp: mocks.serverTimestamp,
  getDocs: vi.fn(),
  limit: vi.fn(),
  orderBy: vi.fn(),
  query: vi.fn(),
}));

import { addLeadCommunication } from '../../services/leadCommunicationsService';

describe('Staff-recorded lead communication evidence', () => {
  beforeEach(() => {
    mocks.addDoc.mockReset().mockResolvedValue({ id: 'communication-1' });
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
});
