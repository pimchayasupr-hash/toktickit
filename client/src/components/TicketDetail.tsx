import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import type { Ticket, Attachment } from '../types';
import { PublicCommentsSection } from './comments/PublicCommentsSection';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

interface TicketDetailProps {
  ticketId: number;
  onBack: () => void;
}

export const TicketDetail: React.FC<TicketDetailProps> = ({ ticketId, onBack }) => {
  const { token } = useAuth();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'comments' | 'attachments'>('comments');

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

  // Problem Appears Resolved State
  const [resolvingState, setResolvingState] = useState(false);
  const [resolveMessage, setResolveMessage] = useState<string | null>(null);

  const fetchTicketDetail = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL}/api/tickets/${ticketId}`, { headers });
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
  }, [ticketId, token]);

  useEffect(() => {
    fetchTicketDetail();
  }, [fetchTicketDetail]);

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploadError(null);
    setUploadSuccess(null);

    const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    const ALLOWED_EXTS = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];
    const fileExt = '.' + (selectedFile.name.split('.').pop() || '').toLowerCase();

    if (!ALLOWED_TYPES.includes(selectedFile.type.toLowerCase()) && !ALLOWED_EXTS.includes(fileExt)) {
      setUploadError(`Invalid file type "${selectedFile.name}". Allowed formats are JPG, PNG, WEBP, and PDF.`);
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setUploadError(`File "${selectedFile.name}" exceeds the 5 MB size limit (${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB).`);
      return;
    }

    setIsUploading(true);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL}/api/tickets/${ticketId}/attachments`, {
        method: 'POST',
        headers,
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to upload attachment.');

      setUploadSuccess(`Attachment "${selectedFile.name}" uploaded successfully.`);
      setSelectedFile(null);
      fetchTicketDetail();
    } catch (err: any) {
      setUploadError(err.message || 'Upload failed.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleProblemResolved = async () => {
    setResolvingState(true);
    setResolveMessage(null);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL}/api/tickets/${ticketId}/comments`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ content: '[SYSTEM]: Requester indicated that the problem appears resolved.' }),
      });

      if (!res.ok) throw new Error('Failed to post resolution indicator.');
      setResolveMessage('Thank you! IT Staff has been notified that your problem appears resolved.');
      fetchTicketDetail();
    } catch (err: any) {
      setResolveMessage('Failed to post status update.');
    } finally {
      setResolvingState(false);
    }
  };

  const handleSoftRemove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!removingAttachment) return;

    const trimmedReason = removalReason.trim();
    if (!trimmedReason) {
      setRemovalError('Removal reason is required.');
      return;
    }

    setIsRemoving(true);
    setRemovalError(null);

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL}/api/attachments/${removingAttachment.id}/remove`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ removalReason: trimmedReason }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to remove attachment.');

      setRemovingAttachment(null);
      setRemovalReason('');
      fetchTicketDetail();
    } catch (err: any) {
      setRemovalError(err.message || 'Removal failed.');
    } finally {
      setIsRemoving(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ maxWidth: '1080px', margin: '3rem auto', textAlign: 'center' }} data-testid="ticket-detail-loading">
        <div style={{ display: 'inline-block', width: '32px', height: '32px', border: '4px solid #005a36', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <p style={{ marginTop: '0.75rem', fontSize: '0.875rem', color: '#64748b' }}>Loading ticket details...</p>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div style={{ maxWidth: '1080px', margin: '2rem auto', padding: '0 1rem' }}>
        <button onClick={onBack} className="tkt-btn-back" style={{ marginBottom: '1rem' }}>
          ← Back to Queue
        </button>
        <div role="alert" className="tkt-alert-error" data-testid="ticket-detail-error">
          <span>⚠️</span>
          <div>{error || 'Ticket not found.'}</div>
        </div>
      </div>
    );
  }

  const activeAttachments = ticket.attachments?.filter((a) => !a.isRemoved) || [];
  const publicComments = ticket.publicComments || [];

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto', padding: '1.5rem 1.25rem' }} data-testid="ticket-detail-container">
      {/* Breadcrumb Header */}
      <div className="tkt-breadcrumb-bar">
        <div className="tkt-breadcrumb-text">
          My Queue &gt; <span>Ticket Detail</span>
        </div>
        <button onClick={onBack} className="tkt-btn-back">
          ← Back to Queue
        </button>
      </div>

      {/* Main Ticket Form Card (Grid) */}
      <div className="tkt-detail-card">
        {/* Row 1: Ticket No, Category, Related System */}
        <div className="tkt-grid-3">
          <div>
            <label className="tkt-label">Ticket No.</label>
            <input
              type="text"
              readOnly
              value={ticket.ticketNumber}
              className="tkt-input"
              style={{ backgroundColor: '#f8fafc', color: '#005a36', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}
            />
          </div>

          <div>
            <label className="tkt-label">Category</label>
            <input
              type="text"
              readOnly
              value={ticket.category?.name || 'General'}
              className="tkt-input"
              style={{ backgroundColor: '#f8fafc' }}
            />
          </div>

          <div>
            <label className="tkt-label">Related System</label>
            <input
              type="text"
              readOnly
              value={ticket.relatedSystem?.name || 'Corporate'}
              className="tkt-input"
              style={{ backgroundColor: '#f8fafc' }}
            />
          </div>
        </div>

        {/* Row 2: Requester, Requested Priority, Current Status */}
        <div className="tkt-grid-3">
          <div>
            <label className="tkt-label">Requester</label>
            <input
              type="text"
              readOnly
              value={ticket.requester?.name || 'Requester'}
              className="tkt-input"
              style={{ backgroundColor: '#f8fafc' }}
            />
          </div>

          <div>
            <label className="tkt-label">Requested Priority</label>
            <div style={{ paddingTop: '0.35rem' }}>
              <span className={`tkt-pill ${ticket.requestedPriority === 'HIGH' || ticket.requestedPriority === 'URGENT' ? 'tkt-pill-priority-high' : ticket.requestedPriority === 'MEDIUM' ? 'tkt-pill-priority-medium' : 'tkt-pill-priority-low'}`}>
                {ticket.requestedPriority}
              </span>
            </div>
          </div>

          <div>
            <label className="tkt-label">Current Status</label>
            <div style={{ paddingTop: '0.35rem' }}>
              <span className="tkt-pill tkt-pill-status-in-progress">
                {ticket.currentStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Row 3: Ticket Owner, IT Priority */}
        <div className="tkt-grid-2">
          <div>
            <label className="tkt-label">Ticket Owner</label>
            <input
              type="text"
              readOnly
              value={ticket.owner ? `${ticket.owner.name} (IT Support)` : 'Unassigned'}
              className="tkt-input"
              style={{ backgroundColor: '#f8fafc' }}
            />
          </div>

          <div>
            <label className="tkt-label">IT Priority</label>
            <div style={{ paddingTop: '0.35rem' }}>
              <span className={`tkt-pill ${ticket.itPriority === 'HIGH' || ticket.itPriority === 'URGENT' ? 'tkt-pill-priority-high' : 'tkt-pill-priority-medium'}`}>
                {ticket.itPriority || ticket.requestedPriority}
              </span>
            </div>
          </div>
        </div>

        {/* Row 4: Summary */}
        <div style={{ marginBottom: '1rem' }}>
          <label className="tkt-label">Summary</label>
          <h2 style={{ margin: '0.25rem 0 0 0', fontSize: '1.2rem', fontWeight: 700, color: '#0f172a' }}>
            {ticket.summary}
          </h2>
        </div>

        {/* Row 5: Description */}
        <div style={{ marginBottom: '1rem' }}>
          <label className="tkt-label">Description</label>
          <textarea
            readOnly
            rows={3}
            value={ticket.description}
            className="tkt-input"
            style={{ resize: 'none' }}
          />
        </div>

        {/* Row 6: Resolution Summary */}
        <div style={{ marginBottom: '1rem' }}>
          <label className="tkt-label">Resolution Summary</label>
          <textarea
            readOnly
            rows={2}
            placeholder="Add resolution summary (visible to requester)..."
            value={ticket.resolutionSummary || ''}
            className="tkt-input"
            style={{ resize: 'none', backgroundColor: '#f8fafc' }}
          />
        </div>

        {/* Action Button: Problem Appears Resolved */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
          <div>
            {resolveMessage && (
              <span style={{ fontSize: '0.8rem', color: '#166534', fontWeight: 500 }}>
                {resolveMessage}
              </span>
            )}
          </div>
          <button
            onClick={handleProblemResolved}
            disabled={resolvingState}
            className="tkt-btn-primary"
            style={{ width: 'auto', backgroundColor: '#eaf6ef', color: '#005a36', border: '1px solid #bbf7d0', boxShadow: 'none' }}
          >
            <span>✓</span> {resolvingState ? 'Submitting...' : 'Problem Appears Resolved'}
          </button>
        </div>
      </div>

      {/* Tabs Container */}
      <div className="tkt-tabs-container">
        <div className="tkt-tabs-nav">
          <button
            onClick={() => setActiveTab('comments')}
            className={`tkt-tab-nav-btn ${activeTab === 'comments' ? 'active' : ''}`}
          >
            <span>💬</span> Public Comments ({publicComments.length})
          </button>
          <button
            onClick={() => setActiveTab('attachments')}
            className={`tkt-tab-nav-btn ${activeTab === 'attachments' ? 'active' : ''}`}
          >
            <span>📎</span> Attachments ({activeAttachments.length})
          </button>
        </div>

        <div className="tkt-tabs-body">
          {activeTab === 'comments' ? (
            <PublicCommentsSection
              ticketId={ticket.id}
              comments={publicComments}
              onCommentAdded={fetchTicketDetail}
            />
          ) : (
            <div>
              {/* Attachments Section */}
              <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.75rem' }}>
                Manage Attachments
              </h4>

              {uploadError && <div className="tkt-alert-error" style={{ marginBottom: '0.75rem' }}>{uploadError}</div>}
              {uploadSuccess && (
                <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', padding: '0.65rem', borderRadius: '8px', fontSize: '0.825rem', marginBottom: '0.75rem' }}>
                  {uploadSuccess}
                </div>
              )}

              <form onSubmit={handleUploadSubmit} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1.25rem' }}>
                <input
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="tkt-input"
                  style={{ flex: 1 }}
                />
                <button
                  type="submit"
                  disabled={!selectedFile || isUploading}
                  className="tkt-btn-primary"
                  style={{ width: 'auto', padding: '0.65rem 1.25rem' }}
                >
                  {isUploading ? 'Uploading...' : 'Upload File'}
                </button>
              </form>

              <div style={{ display: 'grid', gap: '0.5rem' }}>
                {activeAttachments.length === 0 ? (
                  <p style={{ fontSize: '0.85rem', color: '#94a3b8', fontStyle: 'italic' }}>No active attachments.</p>
                ) : (
                  activeAttachments.map((a) => (
                    <div key={a.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                      <div>
                        <a
                          href={`/api/attachments/${a.id}/download`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: '#005a36', fontWeight: 600, fontSize: '0.875rem', textDecoration: 'none' }}
                        >
                          📎 {a.originalFileName}
                        </a>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginLeft: '0.5rem' }}>
                          ({(a.fileSize / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                      <button
                        onClick={() => setRemovingAttachment(a)}
                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', color: '#dc2626', background: 'none', border: '1px solid #fca5a5', borderRadius: '6px', cursor: 'pointer' }}
                      >
                        Remove
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Attachment Soft Removal Modal */}
      {removingAttachment && (
        <div className="tkt-auth-page" style={{ position: 'fixed', inset: 0, zIndex: 50, backgroundColor: 'rgba(15, 23, 42, 0.65)' }}>
          <div className="tkt-auth-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Confirm Attachment Removal</h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem' }}>
              Are you sure you want to remove <strong>{removingAttachment.originalFileName}</strong>? A reason is required.
            </p>

            {removalError && <div className="tkt-alert-error" style={{ marginBottom: '0.75rem' }}>{removalError}</div>}

            <form onSubmit={handleSoftRemove}>
              <div className="tkt-form-group">
                <label className="tkt-label">Removal Reason</label>
                <textarea
                  rows={3}
                  required
                  value={removalReason}
                  onChange={(e) => setRemovalReason(e.target.value)}
                  placeholder="Provide reason for removing this file..."
                  className="tkt-input"
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => { setRemovingAttachment(null); setRemovalReason(''); }}
                  className="tkt-btn-filters"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRemoving}
                  className="tkt-btn-primary"
                  style={{ width: 'auto', backgroundColor: '#dc2626' }}
                >
                  {isRemoving ? 'Removing...' : 'Confirm Remove'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
