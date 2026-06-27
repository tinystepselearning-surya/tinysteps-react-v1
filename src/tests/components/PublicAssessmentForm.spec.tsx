import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import PublicAssessmentForm from '../../components/forms/PublicAssessmentForm';

const trackingMocks = vi.hoisted(() => ({
  trackDemoBookingComplete: vi.fn(),
  trackLeadFormError: vi.fn(),
  trackLeadFormStart: vi.fn(),
  trackLeadFormSubmit: vi.fn(),
  trackWhatsappClick: vi.fn(),
}));

vi.mock('../../lib/conversionTracking', () => trackingMocks);

describe('PublicAssessmentForm analytics', () => {
  beforeEach(() => {
    Object.values(trackingMocks).forEach((mock) => mock.mockReset());
    vi.stubGlobal('open', vi.fn(() => ({ closed: false })));
  });

  it('tracks a single form_error event when validation fails', () => {
    render(<PublicAssessmentForm />);

    fireEvent.submit(screen.getByRole('button', { name: /get free assessment on whatsapp/i }));

    expect(trackingMocks.trackLeadFormError).toHaveBeenCalledTimes(1);
    expect(trackingMocks.trackLeadFormSubmit).not.toHaveBeenCalled();
  });

  it('tracks one submit event for a valid submission', () => {
    render(<PublicAssessmentForm />);

    fireEvent.change(screen.getByLabelText(/parent name/i), { target: { value: 'Priya' } });
    fireEvent.change(screen.getByLabelText(/child name/i), { target: { value: 'Aarav' } });
    fireEvent.change(screen.getByLabelText(/whatsapp number/i), { target: { value: '+919999999999' } });
    fireEvent.change(screen.getByLabelText(/child age/i), { target: { value: '7' } });
    fireEvent.click(screen.getByRole('radio', { name: 'Phonics' }));

    fireEvent.submit(screen.getByRole('button', { name: /get free assessment on whatsapp/i }));

    expect(trackingMocks.trackLeadFormSubmit).toHaveBeenCalledTimes(1);
    expect(trackingMocks.trackDemoBookingComplete).toHaveBeenCalledTimes(1);
    expect(trackingMocks.trackWhatsappClick).toHaveBeenCalledTimes(1);
    expect(trackingMocks.trackLeadFormError).not.toHaveBeenCalled();
  });
});
