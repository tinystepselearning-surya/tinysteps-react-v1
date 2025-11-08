import { useEffect, useRef, useState } from 'react';
import Modal from './Modal';

type ConfirmModalProps = {
  isOpen: boolean;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'default' | 'danger';
  /** If provided, user must type this exact text to enable Confirm (case-sensitive) */
  requiredText?: string;
};

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'default',
  requiredText,
}: ConfirmModalProps) {
  const confirmRef = useRef<HTMLButtonElement | null>(null);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (isOpen) {
      setInputValue('');
      // focus confirm button by default for quick keyboard action
      setTimeout(() => confirmRef.current?.focus(), 0);
    }
  }, [isOpen]);

  const disabled = requiredText ? inputValue !== requiredText : false;

  return (
    <Modal title={title} open={isOpen} onClose={onCancel}>
      <div className="space-y-4">
        {message && <p className="text-sm text-gray-300">{message}</p>}

        {requiredText && (
          <div>
            <label className="block text-xs text-gray-400 mb-2">Type <strong className="text-white">{requiredText}</strong> to confirm</label>
            <input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white"
              placeholder={`Type ${requiredText} to enable`}
            />
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            onClick={onConfirm}
            disabled={disabled}
            className={`px-4 py-2 rounded-lg text-white transition-all ${
              variant === 'danger' ? 'bg-red-500 hover:bg-red-600' : 'bg-orange-500 hover:bg-orange-600'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
