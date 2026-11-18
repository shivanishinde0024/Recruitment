'use client';

import React, { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';

export default function RemarkModal({
  show,
  onHide,
  onSubmit,
  title = 'Provide Remark',
  actionLabel = 'Submit',
  actionVariant = 'primary',
  required = true,
  loading = false
}) {
  const [remark, setRemark] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (required && !remark.trim()) {
      setError('Remark is mandatory for this operation.');
      return;
    }
    setError('');
    onSubmit(remark.trim());
  };

  const handleClose = () => {
    setRemark('');
    setError('');
    onHide();
  };

  return (
    <Modal show={show} onHide={handleClose} centered backdrop="static">
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title className="h5 fw-bold">{title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <div className="alert alert-danger py-2 small">{error}</div>}
          <Form.Group>
            <Form.Label className="small fw-semibold">
              Remark / Reason {required && <span className="text-danger">*</span>}
            </Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              placeholder="Enter official remark or rationale..."
              value={remark}
              onChange={(e) => {
                setRemark(e.target.value);
                if (error) setError('');
              }}
              required={required}
              autoFocus
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant={actionVariant} type="submit" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Submitting...
              </>
            ) : (
              actionLabel
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

