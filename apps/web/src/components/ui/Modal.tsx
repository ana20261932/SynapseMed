import React from 'react';
import { Button } from './Button';

// ── Close icon ─────────────────────────────────────────────────────────────

function CloseIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

// ── Modal ──────────────────────────────────────────────────────────────────

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const modalMaxWidth: Record<string, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  if (!isOpen) return null;
  return (
    <div className="sk-modal-overlay" onClick={onClose}>
      <div
        className={`sk-modal w-full ${modalMaxWidth[size]}`}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="sk-modal-header">
            <h2 className="sk-modal-title">{title}</h2>
            <button
              onClick={onClose}
              className="sk-btn sk-btn-ghost sk-btn-sm p-1.5"
              aria-label="Close"
              style={{ borderRadius: 'var(--radius-md)' }}
            >
              <CloseIcon />
            </button>
          </div>
        )}
        <div className="sk-modal-body">{children}</div>
      </div>
    </div>
  );
}

// ── ConfirmDialog ──────────────────────────────────────────────────────────

interface ConfirmDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onConfirm,
  onCancel,
  title = 'Confirm Action',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  danger = false,
}: ConfirmDialogProps) {
  if (!isOpen) return null;
  return (
    <Modal isOpen={isOpen} onClose={onCancel} title={title} size="sm">
      {message && (
        <p className="mb-5 text-sm" style={{ color: 'var(--color-fg-muted)' }}>
          {message}
        </p>
      )}
      <div className="flex gap-3 justify-end">
        <Button variant="outline" onClick={onCancel}>{cancelText}</Button>
        <Button variant={danger ? 'destructive' : 'primary'} onClick={onConfirm}>{confirmText}</Button>
      </div>
    </Modal>
  );
}
