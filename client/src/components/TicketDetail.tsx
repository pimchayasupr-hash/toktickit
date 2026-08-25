import React, { useState, useEffect } from 'react';
import { useRequester } from '../context/RequesterContext';
import { Ticket, Attachment } from '../types';

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

  // Attachment Actions State
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedAttachmentForRemoval, setSelectedAttachmentForRemoval] = useState<Attachment | null>(null);
  const [removalReason, setRemovalReason] = useState<string>('');
  const [removalError, setRemovalError] = useState<string | null>(null);
  const [isRemoving, setIsRemoving] = useState<boolean>(false);

  const fetchTicketDetail = async () => {
    if (!selectedRequesterId) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/tickets/${ticketId}`, {
        headers: {
          'X-Development-Requester-Id': String(selectedRequesterId),
        },
      });

      if (!res.ok) {
        if (res.status === 404) {
          throw new Error('Ticket not found or you do not have permission to view it.');
        }
        throw new Error(`Failed to load ticket (HTTP ${res.status})`);
      }

      const data = await res.json();
      setTicket(data.ticket);
    } catch (err: any) {
      setError(err.message || 'Unable to connect to server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTicketDetail();
  }, [ticketId, selectedRequesterId]);

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!ALLOWED_TYPES.includes(file.type)) {
      setUploadError('Permitted file types: JPG, PNG, WEBP, PDF.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File size exceeds 5 MB limit.');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

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
        setUploadError(data.error?.message || 'Failed to upload attachment.');
      } else {
        await fetchTicketDetail(); // Refresh list
      }
    } catch (err: any) {
      setUploadError('Failed to upload file.');
    } finally {
      setIsUploading(false);
      e.target.value = ''; // Reset file input
    }
  };

  const handleDownload = (attachmentId: number) => {
    if (!selectedRequesterId) return;
    const downloadUrl = `${API_BASE_URL}/api/attachments/${attachmentId}/download`;

    // Fetch using X-Development-Requester-Id header via blob
    fetch(downloadUrl, {
      headers: {
        'X-Development-Requester-Id': String(selectedRequesterId),
      },
    })
      .then(async (res) => {
        if (!res.ok) {
          const errData = await res.json();
          alert(errData.error?.message || 'Download failed');
          return;
        }
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = '';
        document.body.appendChild(a);
        a.click();
        a.remove();
      })
      .catch(() => {
        alert('Failed to download attachment');
      });
  };

  const handleConfirmRemove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAttachmentForRemoval || !selectedRequesterId) return;

    setRemovalError(null);
    const trimmed = removalReason.trim();
    if (trimmed.length < 3 || trimmed.length > 200) {
      setRemovalError('Removal reason must be between 3 and 200 characters.');
      return;
    }

    setIsRemoving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/attachments/${selectedAttachmentForRemoval.id}/remove`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Development-Requester-Id': String(selectedRequesterId),
        },
        body: JSON.stringify({ removalReason: trimmed }),
      });

      const data = await res.json();
      if (!res.ok) {
        setRemovalError(data.error?.message || 'Failed to remove attachment.');
      } else {
        setSelectedAttachmentForRemoval(null);
        setRemovalReason('');
        await fetchTicketDetail();
      }
    } catch (err) {
      setRemovalError('Error connecting to server.');
    } finally {
      setIsRemoving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-success" role="status"></div>
        <p className="mt-2 text-muted">Loading ticket details...</p>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="container py-4">
        <div className="alert alert-danger" role="alert">
          <h5 className="fw-bold">Unable to Load Ticket</h5>
          <p>{error || 'Ticket not found.'}</p>
          <button type="button" className="btn btn-outline-danger btn-sm" onClick={onBack}>
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
      <div className="mb-3">
        <button type="button" className="btn btn-outline-secondary btn-sm" onClick={onBack}>
          ← Back to My Tickets
        </button>
      </div>

      <div className="row g-4">
        {/* Ticket Header & Read-Only Fields */}
        <div className="col-12 col-lg-8">
          <div className="zen-card p-4 mb-4">
            <div className="d-flex justify-content-between align-items-start border-bottom pb-3 mb-3">
              <div>
                <span className="badge badge-status-new mb-1">{ticket.currentStatus}</span>
                <h3 className="h4 fw-bold text-success m-0">{ticket.ticketNumber}</h3>
                <h5 className="fw-bold mt-2 text-dark">{ticket.summary}</h5>
              </div>
              <span className={`badge badge-priority-${ticket.requestedPriority.toLowerCase()} fs-6`}>
                {ticket.requestedPriority} Priority
              </span>
            </div>

            <div className="row g-3 mb-4 bg-light p-3 rounded">
              <div className="col-6 col-md-3">
                <span className="small text-muted d-block">Category</span>
                <span className="fw-semibold">{ticket.category?.name}</span>
              </div>
              <div className="col-6 col-md-3">
                <span className="small text-muted d-block">Related System</span>
                <span className="fw-semibold">{ticket.relatedSystem?.name}</span>
              </div>
              <div className="col-6 col-md-3">
                <span className="small text-muted d-block">Created Date</span>
                <span className="fw-semibold">{new Date(ticket.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="col-6 col-md-3">
                <span className="small text-muted d-block">Requester</span>
                <span className="fw-semibold">{ticket.requester?.name}</span>
              </div>
            </div>

            <div className="mb-3">
              <h6 className="fw-bold text-success">Detailed Description</h6>
              <div className="p-3 border rounded bg-white white-space-pre-wrap">{ticket.description}</div>
            </div>
          </div>
        </div>

        {/* Attachments Sidebar */}
        <div className="col-12 col-lg-4">
          <div className="zen-card p-3">
            <h5 className="fw-bold text-success mb-3">Attachments ({activeAttachments.length}/5)</h5>

            {uploadError && (
              <div className="alert alert-danger p-2 small" role="alert">
                {uploadError}
              </div>
            )}

            {/* Active Attachments */}
            {activeAttachments.length > 0 ? (
              <div className="d-flex flex-column gap-2 mb-3">
                {activeAttachments.map((att) => (
                  <div key={att.id} className="p-2 border rounded bg-white d-flex justify-content-between align-items-center">
                    <div className="text-truncate me-2 small">
                      📄 <strong>{att.originalFilename}</strong>
                      <div className="extra-small text-muted">{(att.sizeBytes / 1024 / 1024).toFixed(2)} MB</div>
                    </div>
                    <div className="d-flex gap-1">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-success p-1 py-0"
                        title="Download file"
                        onClick={() => handleDownload(att.id)}
                      >
                        ⬇
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger p-1 py-0"
                        title="Remove file"
                        onClick={() => setSelectedAttachmentForRemoval(att)}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted small">No active attachments on this ticket.</p>
            )}

            {/* Upload Button */}
            {activeAttachments.length < 5 && (
              <div className="mb-4">
                <label className="btn btn-outline-success btn-sm w-100 cursor-pointer">
                  {isUploading ? 'Uploading...' : '+ Upload Attachment'}
                  <input
                    type="file"
                    className="d-none"
                    accept=".jpg,.jpeg,.png,.webp,.pdf"
                    onChange={handleUploadFile}
                    disabled={isUploading}
                  />
                </label>
              </div>
            )}

            {/* Removed Attachments Metadata Display */}
            {removedAttachments.length > 0 && (
              <div className="mt-4 pt-3 border-top">
                <h6 className="fw-bold text-muted mb-2">Removed Attachments Audit Log</h6>
                <div className="d-flex flex-column gap-2">
                  {removedAttachments.map((att) => (
                    <div key={att.id} className="p-2 border rounded bg-light opacity-75 small">
                      <div className="text-decoration-line-through text-muted fw-semibold">
                        ❌ {att.originalFilename}
                      </div>
                      <div className="extra-small text-muted mt-1">
                        Removed: {att.removedAt ? new Date(att.removedAt).toLocaleDateString() : 'N/A'}
                        <br />
                        Reason: <em>"{att.removalReason}"</em>
                      </div>
                      <div className="badge bg-secondary extra-small mt-1">Download Blocked</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Soft Removal Modal */}
      {selectedAttachmentForRemoval && (
        <div className="modal d-block bg-dark bg-opacity-50" tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title">Confirm Attachment Removal</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setSelectedAttachmentForRemoval(null)}
                ></button>
              </div>
              <form onSubmit={handleConfirmRemove}>
                <div className="modal-body">
                  <p>
                    Are you sure you want to remove <strong>{selectedAttachmentForRemoval.originalFilename}</strong>?
                    <br />
                    <span className="text-muted small">
                      The file will be soft-removed and its download will be blocked, but metadata and removal reason will be preserved.
                    </span>
                  </p>

                  {removalError && <div className="alert alert-danger small p-2">{removalError}</div>}

                  <div className="mb-3">
                    <label htmlFor="removal-reason" className="form-label fw-bold small">
                      Reason for Removal <span className="text-danger">*</span>
                    </label>
                    <textarea
                      id="removal-reason"
                      className="form-control form-control-sm"
                      rows={3}
                      placeholder="Enter reason for removing this file (3 - 200 characters)"
                      value={removalReason}
                      onChange={(e) => setRemovalReason(e.target.value)}
                      maxLength={200}
                      required
                    ></textarea>
                    <div className="text-muted extra-small text-end mt-1">{removalReason.length}/200</div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-sm btn-secondary"
                    onClick={() => setSelectedAttachmentForRemoval(null)}
                    disabled={isRemoving}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-sm btn-danger" disabled={isRemoving || !removalReason.trim()}>
                    {isRemoving ? 'Removing...' : 'Confirm Remove'}
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
