import React, { useState, useEffect, useCallback } from 'react';
import { useRequester } from '../context/RequesterContext';
import type { Ticket, Attachment } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

interface TicketDetailProps {
  ticketId: number;
  onBack: () => void;
}

export const TicketDetail: React.FC<TicketDetailProps> = ({ ticketId, onBack }) => {
  const { selectedRequesterId } = useRequester();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // File Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  // Soft Removal Modal State
  const [removingAttachment, setRemovingAttachment] = useState<Attachment | null>(null);
  const [removalReason, setRemovalReason] = useState<string>('');
  const [isRemoving, setIsRemoving] = useState<boolean>(false);
  const [removalError, setRemovalError] = useState<string | null>(null);

  const fetchTicketDetail = useCallback(async () => {
    if (!selectedRequesterId) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/tickets/${ticketId}`, {
        headers: {
          'X-Development-Requester-Id': String(selectedRequesterId),
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || `HTTP ${res.status}: Failed to load ticket details.`);
      }

      setTicket(data.ticket);
    } catch (err: any) {
      setError(err.message || 'Unable to connect to server.');
      setTicket(null);
    } finally {
      setIsLoading(false);
    }
  }, [selectedRequesterId, ticketId]);

  useEffect(() => {
    fetchTicketDetail();
  }, [fetchTicketDetail]);

  // Handle Attachment Upload
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploadError(null);
    setUploadSuccess(null);
    setIsUploading(true);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const res = await fetch(`${API_BASE_URL}/api/tickets/${ticketId}/attachments`, {
        method: 'POST',
        headers: {
          'X-Development-Requester-Id': String(selectedRequesterId),
        },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || 'File upload failed.');
      }

      setUploadSuccess(`File "${data.attachment.originalFilename}" uploaded successfully.`);
      setSelectedFile(null);
      fetchTicketDetail();
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload attachment.');
    } finally {
      setIsUploading(false);
    }
  };

  // Handle Attachment Soft Removal
  const handleRemoveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!removingAttachment) return;

    if (removalReason.trim().length < 3 || removalReason.trim().length > 200) {
      setRemovalError('Removal reason must be between 3 and 200 characters.');
      return;
    }

    setRemovalError(null);
    setIsRemoving(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/attachments/${removingAttachment.id}/remove`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Development-Requester-Id': String(selectedRequesterId),
        },
        body: JSON.stringify({
          removalReason: removalReason.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to remove attachment.');
      }

      setRemovingAttachment(null);
      setRemovalReason('');
      fetchTicketDetail();
    } catch (err: any) {
      setRemovalError(err.message || 'Failed to remove attachment.');
    } finally {
      setIsRemoving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-success" role="status"></div>
        <p className="mt-2 text-muted">Loading ticket detail...</p>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="container py-4">
        <div className="alert alert-danger zen-card p-4" role="alert">
          <h4 className="fw-bold mb-2">Access Denied or Ticket Not Found</h4>
          <p className="mb-3">{error || 'The requested ticket does not exist or does not belong to your account.'}</p>
          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={onBack}>
            ← Back to My Tickets
          </button>
        </div>
      </div>
    );
  }

  const activeAttachments = ticket.attachments?.filter((a) => !a.isRemoved) || [];
  const removedAttachments = ticket.attachments?.filter((a) => a.isRemoved) || [];

  return (
    <div className="container py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <button type="button" className="btn btn-sm btn-outline-secondary mb-2" onClick={onBack}>
            ← Back to My Tickets
          </button>
          <h2 className="h4 fw-bold text-success m-0">Ticket Details: {ticket.ticketNumber}</h2>
        </div>
        <span className="badge bg-success-subtle text-success border border-success-subtle px-3 py-2 fs-6">
          Status: NEW
        </span>
      </div>

      {/* Read-Only Information Card */}
      <div className="zen-card p-4 mb-4">
        <h5 className="fw-bold text-success mb-3 border-bottom pb-2">Ticket Metadata (Read-Only)</h5>
        <div className="row g-3 mb-3">
          <div className="col-12 col-md-3">
            <label className="form-label small text-muted mb-1">Ticket Number</label>
            <input type="text" className="form-control form-control-sm bg-white" value={ticket.ticketNumber} disabled readOnly />
          </div>
          <div className="col-12 col-md-3">
            <label className="form-label small text-muted mb-1">Created Date</label>
            <input
              type="text"
              className="form-control form-control-sm bg-white"
              value={new Date(ticket.createdAt).toLocaleString()}
              disabled
              readOnly
            />
          </div>
          <div className="col-12 col-md-3">
            <label className="form-label small text-muted mb-1">Category</label>
            <input type="text" className="form-control form-control-sm bg-white" value={ticket.category?.name} disabled readOnly />
          </div>
          <div className="col-12 col-md-3">
            <label className="form-label small text-muted mb-1">Related System</label>
            <input
              type="text"
              className="form-control form-control-sm bg-white"
              value={ticket.relatedSystem?.name}
              disabled
              readOnly
            />
          </div>
        </div>

        <div className="row g-3 mb-3">
          <div className="col-12 col-md-6">
            <label className="form-label small text-muted mb-1">Requester Owner</label>
            <input
              type="text"
              className="form-control form-control-sm bg-white"
              value={`${ticket.requester?.name} (${ticket.requester?.email})`}
              disabled
              readOnly
            />
          </div>
          <div className="col-12 col-md-6">
            <label className="form-label small text-muted mb-1">Requested Priority</label>
            <div>
              <span className={`badge badge-priority-${ticket.requestedPriority.toLowerCase()} fs-6`}>
                {ticket.requestedPriority}
              </span>
            </div>
          </div>
        </div>

        <div className="mb-3">
          <label className="form-label small text-muted mb-1">Ticket Summary</label>
          <input type="text" className="form-control bg-white fw-medium" value={ticket.summary} disabled readOnly />
        </div>

        <div>
          <label className="form-label small text-muted mb-1">Detailed Description</label>
          <textarea className="form-control bg-white" rows={5} value={ticket.description} disabled readOnly></textarea>
        </div>
      </div>

      {/* Attachments Section */}
      <div className="zen-card p-4">
        <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
          <h5 className="fw-bold text-success m-0">
            Supporting Attachments ({activeAttachments.length}/5)
          </h5>
          <span className="text-muted extra-small">JPG, PNG, WEBP, PDF • Max 5MB per file</span>
        </div>

        {uploadError && (
          <div className="alert alert-danger p-2 small mb-3" role="alert">
            {uploadError}
          </div>
        )}

        {uploadSuccess && (
          <div className="alert alert-success p-2 small mb-3" role="alert">
            {uploadSuccess}
          </div>
        )}

        {/* Upload Form */}
        {activeAttachments.length < 5 && (
          <form onSubmit={handleUploadSubmit} className="bg-zen-pale p-3 rounded mb-4">
            <label className="form-label fw-semibold small mb-2">Upload New Supporting File</label>
            <div className="input-group">
              <input
                type="file"
                className="form-control form-control-sm"
                accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                disabled={isUploading}
              />
              <button type="submit" className="btn btn-zen-primary btn-sm" disabled={!selectedFile || isUploading}>
                {isUploading ? 'Uploading...' : 'Upload File'}
              </button>
            </div>
          </form>
        )}

        {/* Active Attachments List */}
        {activeAttachments.length === 0 ? (
          <p className="text-muted small italic my-3">No active attachments added to this ticket.</p>
        ) : (
          <ul className="list-group mb-4">
            {activeAttachments.map((att) => (
              <li key={att.id} className="list-group-item d-flex justify-content-between align-items-center py-2 px-3">
                <div className="d-flex align-items-center gap-2">
                  <span className="fs-5">📎</span>
                  <div>
                    <div className="fw-medium small">{att.originalFilename}</div>
                    <div className="extra-small text-muted">
                      {(att.sizeBytes / 1024).toFixed(1)} KB • {att.mimeType}
                    </div>
                  </div>
                </div>
                <div className="d-flex gap-2">
                  <a
                    href={`${API_BASE_URL}/api/attachments/${att.id}/download`}
                    className="btn btn-sm btn-outline-success"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Download
                  </a>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => {
                      setRemovingAttachment(att);
                      setRemovalReason('');
                      setRemovalError(null);
                    }}
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* Removed Attachments Metadata (Audit Log) */}
        {removedAttachments.length > 0 && (
          <div className="mt-4 pt-3 border-top">
            <h6 className="fw-bold text-muted mb-2">Soft-Removed Attachments Audit Log</h6>
            <div className="d-flex flex-column gap-2">
              {removedAttachments.map((att) => (
                <div key={att.id} className="p-2 rounded bg-light border text-muted extra-small">
                  <div className="d-flex justify-content-between">
                    <span className="text-decoration-line-through fw-semibold">{att.originalFilename}</span>
                    <span className="badge bg-secondary">Removed</span>
                  </div>
                  <div className="mt-1">
                    <strong>Removal Reason:</strong> {att.removalReason || 'No reason provided'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Soft Removal Confirmation Modal */}
      {removingAttachment && (
        <div className="modal d-block bg-dark bg-opacity-50" tabIndex={-1} role="dialog">
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content zen-card">
              <div className="modal-header border-bottom">
                <h5 className="modal-title text-danger fw-bold">Confirm Attachment Removal</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setRemovingAttachment(null)}
                  disabled={isRemoving}
                ></button>
              </div>
              <form onSubmit={handleRemoveSubmit}>
                <div className="modal-body">
                  <p className="small mb-3">
                    Are you sure you want to remove <strong>{removingAttachment.originalFilename}</strong>? This action uses
                    soft-removal. The file will be blocked from downloading, but its metadata will be preserved.
                  </p>

                  {removalError && (
                    <div className="alert alert-danger p-2 small mb-3" role="alert">
                      {removalError}
                    </div>
                  )}

                  <div className="mb-3">
                    <label htmlFor="removal-reason" className="form-label fw-semibold small">
                      Reason for Removal <span className="text-danger">*</span>
                    </label>
                    <textarea
                      id="removal-reason"
                      className="form-control form-control-sm"
                      rows={3}
                      placeholder="Please specify why this attachment is being removed (3 - 200 characters)"
                      value={removalReason}
                      onChange={(e) => setRemovalReason(e.target.value)}
                      maxLength={200}
                      required
                    ></textarea>
                    <div className="text-end extra-small text-muted mt-1">{removalReason.length}/200</div>
                  </div>
                </div>
                <div className="modal-footer border-top">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => setRemovingAttachment(null)}
                    disabled={isRemoving}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-sm btn-danger" disabled={isRemoving || !removalReason.trim()}>
                    {isRemoving ? 'Removing...' : 'Confirm Soft Removal'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
