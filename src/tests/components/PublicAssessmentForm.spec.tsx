import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import PublicAssessmentForm from '../../components/forms/PublicAssessmentForm';
import { PUBLIC_MAIN_CONCERN_OPTIONS } from '../../lib/publicLeadForm';

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
  fireEvent.change(screen.getByLabelText(/choose the area where your child needs support/i), {
    target: { value: 'Blending sounds to read words' },
  });
}

describe('PublicAssessmentForm analytics', () => {
  const popupLocationReplace = vi.fn();
  const popupWindow: {
    closed: boolean;
    opener: Window | null;
    location: {
      replace: typeof popupLocationReplace;
    };
  } = {
    closed: false,
    opener: window,
    location: {
      replace: popupLocationReplace,
    },
  };
  const anchorClick = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  const locationAssignMock = vi.fn();

  beforeEach(() => {
    Object.values(trackingMocks).forEach((mock) => mock.mockReset());
    Object.values(firestoreMocks).forEach((mock) => mock.mockReset());
    popupLocationReplace.mockReset();
    locationAssignMock.mockReset();
    anchorClick.mockClear();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        ...window.location,
        assign: locationAssignMock,
      },
    });
    vi.stubGlobal('open', vi.fn(() => popupWindow));
    firestoreMocks.collection.mockReturnValue('leads-collection');
    firestoreMocks.serverTimestamp.mockReturnValue('server-timestamp');
    popupWindow.closed = false;
    popupWindow.opener = window;
  });

  it('tracks a single form_error event when validation fails', () => {
    render(<PublicAssessmentForm />);

    fireEvent.submit(screen.getByRole('button', { name: /book free 35-minute demo on whatsapp/i }));

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

    fireEvent.submit(screen.getByRole('button', { name: /book free 35-minute demo on whatsapp/i }));

    expect(screen.getByText(/please select the support area/i)).toBeInTheDocument();
    expect(trackingMocks.trackLeadFormSubmit).not.toHaveBeenCalled();
  });

  it('renders only the required support-area dropdown with the exact options', () => {
    render(<PublicAssessmentForm />);

    expect(screen.queryByRole('radio', { name: /phonics|reading|grammar|speaking/i })).toBeNull();
    expect(screen.queryByLabelText(/optional details/i)).toBeNull();

    const supportArea = screen.getByLabelText(/choose the area where your child needs support/i);
    expect(supportArea).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Choose the area where your child needs support' })).toBeInTheDocument();

    PUBLIC_MAIN_CONCERN_OPTIONS.forEach((option) => {
      expect(screen.getByRole('option', { name: option })).toBeInTheDocument();
    });
  });

  it('fires generate_lead only after a successful save and before WhatsApp opens', async () => {
    firestoreMocks.addDoc.mockResolvedValue({ id: 'lead-123' });
    render(<PublicAssessmentForm />);

    fillValidForm();

    fireEvent.submit(screen.getByRole('button', { name: /book free 35-minute demo on whatsapp/i }));

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
        mainConcern: 'Blending sounds to read words',
        urgency: null,
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
      mainConcern: 'Blending sounds to read words',
      value: 1,
    }));
    expect(trackingMocks.trackDemoBookingComplete).toHaveBeenCalledTimes(1);
    expect(trackingMocks.trackWhatsappClick).toHaveBeenCalledTimes(1);
    expect(trackingMocks.trackLeadFormError).not.toHaveBeenCalled();
    expect(globalThis.open).toHaveBeenCalledTimes(1);
    expect(globalThis.open).toHaveBeenCalledWith('about:blank', 'tinyStepsAssessmentWhatsApp');
    expect(popupWindow.opener).toBeNull();
    expect(popupLocationReplace).toHaveBeenCalledTimes(1);
    expect(locationAssignMock).not.toHaveBeenCalled();
    expect(anchorClick).not.toHaveBeenCalled();

    const whatsappUrl = popupLocationReplace.mock.calls[0]?.[0];
    expect(decodeURIComponent(whatsappUrl)).toContain('Parent name: Priya');
    expect(decodeURIComponent(whatsappUrl)).toContain('Child name: Aarav');
    expect(decodeURIComponent(whatsappUrl)).toContain('WhatsApp number: +919999999999');
    expect(decodeURIComponent(whatsappUrl)).toContain('Child age: 7');
    expect(decodeURIComponent(whatsappUrl)).toContain('Support area: Blending sounds to read words');

    const openOrder = (globalThis.open as any).mock.invocationCallOrder[0];
    const saveOrder = firestoreMocks.addDoc.mock.invocationCallOrder[0];
    const generateLeadOrder = trackingMocks.trackGenerateLead.mock.invocationCallOrder[0];
    const navigateOrder = popupLocationReplace.mock.invocationCallOrder[0];
    const whatsappOrder = trackingMocks.trackWhatsappClick.mock.invocationCallOrder[0];

    expect(openOrder).toBeLessThan(saveOrder);
    expect(saveOrder).toBeLessThan(generateLeadOrder);
    expect(generateLeadOrder).toBeLessThan(navigateOrder);
    expect(navigateOrder).toBeLessThan(whatsappOrder);
  });

  it('uses same-tab fallback once when the popup is blocked', async () => {
    vi.stubGlobal('open', vi.fn(() => null));
    firestoreMocks.addDoc.mockResolvedValue({ id: 'lead-123' });
    render(<PublicAssessmentForm />);

    fillValidForm();

    fireEvent.submit(screen.getByRole('button', { name: /book free 35-minute demo on whatsapp/i }));

    await waitFor(() => expect(firestoreMocks.addDoc).toHaveBeenCalledTimes(1));
    expect(globalThis.open).toHaveBeenCalledTimes(1);
    expect(locationAssignMock).toHaveBeenCalledTimes(1);
    expect(locationAssignMock.mock.calls[0]?.[0]).toContain('https://wa.me/919618398383?text=');
    expect(popupLocationReplace).not.toHaveBeenCalled();
    expect(anchorClick).not.toHaveBeenCalled();
    expect(trackingMocks.trackGenerateLead).toHaveBeenCalledTimes(1);
    expect(trackingMocks.trackWhatsappClick).toHaveBeenCalledTimes(1);
  });

  it('still opens WhatsApp and shows a warning when lead save fails', async () => {
    firestoreMocks.addDoc.mockRejectedValue(new Error('save failed'));
    render(<PublicAssessmentForm />);

    fillValidForm();

    fireEvent.submit(screen.getByRole('button', { name: /book free 35-minute demo on whatsapp/i }));

    await waitFor(() => expect(firestoreMocks.addDoc).toHaveBeenCalledTimes(1));
    expect(trackingMocks.trackLeadFormSubmit).toHaveBeenCalledTimes(1);
    expect(trackingMocks.trackGenerateLead).not.toHaveBeenCalled();
    expect(trackingMocks.trackDemoBookingComplete).not.toHaveBeenCalled();
    expect(trackingMocks.trackWhatsappClick).toHaveBeenCalledTimes(1);
    expect(globalThis.open).toHaveBeenCalledTimes(1);
    expect(popupLocationReplace).toHaveBeenCalledTimes(1);
    expect(locationAssignMock).not.toHaveBeenCalled();
    expect(anchorClick).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent(
      'We could not save your request on the website, but WhatsApp is opening with your completed message. Please send it so we can help you.'
    );
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('prevents duplicate lead creation on double submit', async () => {
    let resolveSave: ((value: { id: string }) => void) | undefined;
    firestoreMocks.addDoc.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSave = resolve;
        }),
    );
    render(<PublicAssessmentForm />);

    fillValidForm();

    const submitButton = screen.getByRole('button', { name: /book free 35-minute demo on whatsapp/i });
    fireEvent.click(submitButton);
    fireEvent.click(submitButton);

    await waitFor(() => expect(firestoreMocks.addDoc).toHaveBeenCalledTimes(1));
    expect(globalThis.open).toHaveBeenCalledTimes(1);

    resolveSave?.({ id: 'lead-123' });

    await waitFor(() => expect(trackingMocks.trackGenerateLead).toHaveBeenCalledTimes(1));
    expect(popupLocationReplace).toHaveBeenCalledTimes(1);
    expect(locationAssignMock).not.toHaveBeenCalled();
    expect(anchorClick).not.toHaveBeenCalled();
  });

  it('does not render the urgency field in the public form', () => {
    render(<PublicAssessmentForm />);

    expect(screen.queryByLabelText(/when do you want to start/i)).toBeNull();
  });
});
