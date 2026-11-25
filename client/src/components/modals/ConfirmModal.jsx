'use client';

import React from 'react';
import { Modal, Button } from 'react-bootstrap';

export default function ConfirmModal({
  show,
  isOpen,
  onHide,
  onCancel,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  confirmVariant = 'danger',
  loading = false
}) {
  const isVisible = show !== undefined ? Boolean(show) : Boolean(isOpen);
  const handleClose = onHide || onCancel;

  return (
    <Modal show={isVisible} onHide={handleClose} centered backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title className="h5 fw-bold">{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="text-secondary mb-0">{message}</p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button variant={confirmVariant} onClick={onConfirm} disabled={loading}>
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Processing...
            </>
          ) : (
            confirmText
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

