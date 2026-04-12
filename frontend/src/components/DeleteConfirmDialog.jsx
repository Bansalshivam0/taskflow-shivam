import React from 'react';
import { Plus, Loader2 } from 'lucide-react';

const DeleteConfirmDialog = ({
  isOpen,
  title,
  description,
  confirmLabel = 'Delete',
  isDeleting,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      role="presentation"
      onClick={(e) => { if (e.target === e.currentTarget && !isDeleting) onCancel(); }}
    >
      <div className="auth-card modal-content" style={{ maxWidth: '440px', width: '90%' }}>
        <button
          type="button"
          onClick={() => !isDeleting && onCancel()}
          className="close-btn"
          style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          aria-label="Close"
        >
          <Plus size={20} style={{ transform: 'rotate(45deg)' }} />
        </button>

        <div className="auth-header" style={{ textAlign: 'left' }}>
          <h1>{title}</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>{description}</p>
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '28px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn"
            onClick={onConfirm}
            disabled={isDeleting}
            style={{ background: 'var(--error)', color: '#fff' }}
          >
            {isDeleting ? <Loader2 className="animate-spin" size={20} /> : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmDialog;
