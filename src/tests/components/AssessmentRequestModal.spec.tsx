import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import AssessmentRequestModal from '../../components/common/AssessmentRequestModal';

vi.mock('../../components/forms/BookAssessmentForm', () => ({
  default: () => (
    <div>
      <input aria-label="Parent name" />
      <button type="button">Continue</button>
    </div>
  ),
}));

describe('AssessmentRequestModal', () => {
  it('focuses the close control without opening the mobile keyboard and restores prior state', () => {
    const opener = document.createElement('button');
    document.body.appendChild(opener);
    opener.focus();
    const onClose = vi.fn();

    const { rerender, unmount } = render(<AssessmentRequestModal isOpen onClose={onClose} />);
    expect(screen.getByRole('dialog', { name: 'Book an assessment' })).toBeInTheDocument();
    const closeButton = screen.getByRole('button', { name: 'Close assessment form' });
    expect(closeButton).toHaveFocus();
    expect(document.body.style.overflow).toBe('hidden');

    rerender(<AssessmentRequestModal isOpen={false} onClose={onClose} />);
    expect(document.body.style.overflow).toBe('');
    expect(opener).toHaveFocus();
    unmount();
    opener.remove();
  });

  it('resizes the mobile scroll area when an Android keyboard reduces visible height', () => {
    const originalWidth = window.innerWidth;
    const originalViewport = window.visualViewport;
    const mobileViewport = {
      height: 480,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 390 });
    Object.defineProperty(window, 'visualViewport', { configurable: true, value: mobileViewport });

    try {
      const { unmount } = render(<AssessmentRequestModal isOpen onClose={vi.fn()} />);
      const panel = screen.getByRole('dialog').querySelector('.overflow-hidden') as HTMLElement;
      const scrollArea = screen.getByRole('dialog').querySelector('.overflow-y-auto') as HTMLElement;
      expect(panel.style.maxHeight).toBe('464px');
      expect(scrollArea.style.maxHeight).toBe('464px');
      mobileViewport.height = 300;
      fireEvent.resize(window);
      expect(panel.style.maxHeight).toBe('284px');
      expect(scrollArea.style.maxHeight).toBe('284px');
      unmount();
      expect(mobileViewport.removeEventListener).toHaveBeenCalled();
    } finally {
      Object.defineProperty(window, 'innerWidth', { configurable: true, value: originalWidth });
      Object.defineProperty(window, 'visualViewport', { configurable: true, value: originalViewport });
    }
  });

  it('keeps its close button visible as form content scrolls and supports Escape', () => {
    const onClose = vi.fn();
    render(<AssessmentRequestModal isOpen onClose={onClose} />);
    const dialog = screen.getByRole('dialog');
    const scrollArea = dialog.querySelector('.overflow-y-auto');
    expect(scrollArea).toHaveClass('overscroll-contain');
    expect(scrollArea).toHaveClass('scroll-pb-24');
    expect(screen.getByRole('button', { name: 'Close assessment form' })).toHaveClass('absolute');
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
