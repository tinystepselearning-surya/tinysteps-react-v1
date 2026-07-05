import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import PublicAssessmentForm from '../../components/forms/PublicAssessmentForm';

const trackingMocks = vi.hoisted(() => ({
  trackDemoBookingComplete: vi.fn(),
  trackLeadFormView: vi.fn(),
  trackGenerateLead: vi.fn(),
  trackLeadFormError: vi.fn(),
  trackLeadFormStart: vi.fn(),
  trackLeadFormSubmit: vi.fn(),
  trackWhatsappClick: vi.fn(),
}));

vi.mock('../../lib/conversionTracking', () => trackingMocks);
const firestoreMocks = vi.hoisted(() => ({
  addDoc: vi.fn(),
  collection: vi.fn(() => 'leads-collection'),
  serverTimestamp: vi.fn(() => 'server-timestamp'),
}));

vi.mock('firebase/firestore', () => firestoreMocks);
vi.mock('../../lib/firebaseConfig', () => ({
  db: {},
}));

function fillValidForm() {
  fireEvent.change(screen.getByLabelText(/parent name/i), { target: { value: 'Priya' } });
  fireEvent.change(screen.getByLabelText(/child name/i), { target: { value: 'Aarav' } });
  fireEvent.change(screen.getByLabelText(/whatsapp number/i), { target: { value: '+919999999999' } });
  fireEvent.change(screen.getByLabelText(/child age/i), { target: { value: '7' } });
  fireEvent.change(screen.getByLabelText(/when do you want to start/i), { target: { value: 'This week' } });
  fireEvent.click(screen.getByRole('radio', { name: 'Phonics' }));
  fireEvent.change(screen.getByLabelText(/what is your child struggling with most/i), {
    target: { value: 'Struggles with blending' },
  });
}

describe('PublicAssessmentForm analytics', () => {
  beforeEach(() => {
    Object.values(trackingMocks).forEach((mock) => mock.mockReset());
    Object.values(firestoreMocks).forEach((mock) => mock.mockReset());
    vi.stubGlobal('open', vi.fn(() => ({ closed: false })));
    firestoreMocks.collection.mockReturnValue('leads-collection');
    firestoreMocks.serverTimestamp.mockReturnValue('server-timestamp');
  });

  it('tracks a single form_error event when validation fails', () => {
    render(<PublicAssessmentForm />);

    fireEvent.submit(screen.getByRole('button', { name: /get free assessment on whatsapp/i }));

    expect(trackingMocks.trackLeadFormError).toHaveBeenCalledTimes(1);
    expect(trackingMocks.trackLeadFormSubmit).not.toHaveBeenCalled();
    expect(trackingMocks.trackGenerateLead).not.toHaveBeenCalled();
  });

  it('requires mainConcern before submission', () => {
    render(<PublicAssessmentForm />);

    fireEvent.change(screen.getByLabelText(/parent name/i), { target: { value: 'Priya' } });
    fireEvent.change(screen.getByLabelText(/child name/i), { target: { value: 'Aarav' } });
    fireEvent.change(screen.getByLabelText(/whatsapp number/i), { target: { value: '+919999999999' } });
    fireEvent.change(screen.getByLabelText(/child age/i), { target: { value: '7' } });
    fireEvent.click(screen.getByRole('radio', { name: 'Phonics' }));

    fireEvent.submit(screen.getByRole('button', { name: /get free assessment on whatsapp/i }));

    expect(screen.getByText(/please select the main concern/i)).toBeInTheDocument();
    expect(trackingMocks.trackLeadFormSubmit).not.toHaveBeenCalled();
  });

  it('fires generate_lead only after a successful save and before WhatsApp opens', async () => {
    firestoreMocks.addDoc.mockResolvedValue({ id: 'lead-123' });
    render(<PublicAssessmentForm />);

    fillValidForm();

    fireEvent.submit(screen.getByRole('button', { name: /get free assessment on whatsapp/i }));

    await waitFor(() => expect(firestoreMocks.addDoc).toHaveBeenCalledTimes(1));
    expect(firestoreMocks.addDoc).toHaveBeenCalledWith(
      'leads-collection',
      expect.objectContaining({
        parentName: 'Priya',
        childName: 'Aarav',
        whatsappNumber: '+919999999999',
        primaryPhone: '+919999999999',
        childAge: 7,
        programInterest: 'Phonics',
        mainConcern: 'Struggles with blending',
        urgency: 'This week',
        requestedAt: 'server-timestamp',
        createdAt: 'server-timestamp',
        updatedAt: 'server-timestamp',
      }),
    );
    expect(firestoreMocks.addDoc.mock.calls[0]?.[1]).not.toHaveProperty('status');
    expect(firestoreMocks.addDoc.mock.calls[0]?.[1]).not.toHaveProperty('priority');
    expect(trackingMocks.trackLeadFormSubmit).toHaveBeenCalledTimes(1);
    expect(trackingMocks.trackGenerateLead).toHaveBeenCalledTimes(1);
    expect(trackingMocks.trackGenerateLead).toHaveBeenCalledWith(expect.objectContaining({
      page_path: '/',
      form_name: 'public_assessment_form',
      source_context: 'public_assessment_form',
      lead_channel: 'assessment_form',
      lead_type: 'parent_assessment_request',
      form_id: 'public_assessment_form',
      source: 'public_assessment_form',
      submission_id: 'lead-123',
      childAge: '7',
      interest: 'Phonics',
      mainConcern: 'Struggles with blending',
      urgency: 'This week',
      value: 1,
    }));
    expect(trackingMocks.trackDemoBookingComplete).toHaveBeenCalledTimes(1);
    expect(trackingMocks.trackWhatsappClick).toHaveBeenCalledTimes(1);
    expect(trackingMocks.trackLeadFormError).not.toHaveBeenCalled();
    expect(globalThis.open).toHaveBeenCalledTimes(1);

    const saveOrder = firestoreMocks.addDoc.mock.invocationCallOrder[0];
    const generateLeadOrder = trackingMocks.trackGenerateLead.mock.invocationCallOrder[0];
    const openOrder = (globalThis.open as any).mock.invocationCallOrder[0];
    const whatsappOrder = trackingMocks.trackWhatsappClick.mock.invocationCallOrder[0];

    expect(saveOrder).toBeLessThan(generateLeadOrder);
    expect(generateLeadOrder).toBeLessThan(openOrder);
    expect(openOrder).toBeLessThan(whatsappOrder);
  });

  it('does not fire generate_lead or open WhatsApp when lead save fails', async () => {
    firestoreMocks.addDoc.mockRejectedValue(new Error('save failed'));
    render(<PublicAssessmentForm />);

    fillValidForm();

    fireEvent.submit(screen.getByRole('button', { name: /get free assessment on whatsapp/i }));

    await waitFor(() => expect(firestoreMocks.addDoc).toHaveBeenCalledTimes(1));
    expect(trackingMocks.trackLeadFormSubmit).toHaveBeenCalledTimes(1);
    expect(trackingMocks.trackGenerateLead).not.toHaveBeenCalled();
    expect(trackingMocks.trackWhatsappClick).not.toHaveBeenCalled();
    expect(globalThis.open).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('We could not save your request. Please try again.');
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('renders an optional urgency field in the public form', () => {
    render(<PublicAssessmentForm />);

    expect(screen.getByLabelText(/when do you want to start/i)).toBeInTheDocument();
  });
});
