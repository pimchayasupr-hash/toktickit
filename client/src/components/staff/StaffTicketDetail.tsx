import React, { useState, useEffect } from 'react';
import type { Ticket, User, Attachment } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { PublicCommentsSection } from '../comments/PublicCommentsSection';
import { InternalNotesSection } from '../comments/InternalNotesSection';

interface StaffTicketDetailProps {
  ticketId: number;
  onBack: () => void;
}

const PERMITTED_TRANSITIONS: Record<string, string[]> = {
  NEW: ['OPEN', 'IN_PROGRESS', 'CANCELLED'],
  OPEN: ['WAITING_FOR_REQUESTER', 'RESOLVED', 'CANCELLED', 'IN_PROGRESS'],
  IN_PROGRESS: ['WAITING_FOR_REQUESTER', 'RESOLVED', 'CANCELLED', 'OPEN'],
  WAITING_FOR_REQUESTER: ['IN_PROGRESS', 'RESOLVED', 'CANCELLED'],
  RESOLVED: ['CLOSED', 'REOPENED'],
  CLOSED: ['REOPENED'],
  REOPENED: ['IN_PROGRESS', 'RESOLVED', 'CANCELLED'],
  CANCELLED: [],
};

export const StaffTicketDetail: React.FC<StaffTicketDetailProps> = ({ ticketId, onBack }) => {
  const { token, user: loggedInUser } = useAuth();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [staffUsers, setStaffUsers] = useState<User[]>([]);

  // Action feedback
  const [actionMessage, setActionMessage] = useState<string | null>(null);

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

  useEffect(() => {
    fetchTicketDetail();
    fetchStaffUsers();
  }, [ticketId]);

  const fetchTicketDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/staff/tickets/${ticketId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load ticket detail.');
      const data = await res.json();
      setTicket(data.ticket);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStaffUsers = async () => {
    try {
      const res = await fetch('/api/admin/users?role=STAFF', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStaffUsers(data.users || []);
      }
    } catch {}
  };

  const handleClaim = async () => {
    setActionMessage(null);
    try {
      const res = await fetch(`/api/staff/tickets/${ticketId}/claim`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to claim ticket.');
      setActionMessage('Successfully claimed ticket ownership.');
      fetchTicketDetail();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleAssign = async (targetOwnerId: string) => {
    setActionMessage(null);
    try {
      const res = await fetch(`/api/staff/tickets/${ticketId}/assign`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ownerId: targetOwnerId ? parseInt(targetOwnerId, 10) : null }),
      });
      if (!res.ok) throw new Error('Failed to reassign ticket.');
      setActionMessage('Ticket owner updated successfully.');
      fetchTicketDetail();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handlePriorityChange = async (newPriority: string) => {
    setActionMessage(null);
    try {
      const res = await fetch(`/api/staff/tickets/${ticketId}/priority`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ itPriority: newPriority }),
      });
      if (!res.ok) throw new Error('Failed to update priority.');
      setActionMessage('IT Priority updated successfully.');
      fetchTicketDetail();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    setActionMessage(null);
    try {
      const res = await fetch(`/api/staff/tickets/${ticketId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || 'Invalid status transition.');
      }
      setActionMessage(`Ticket status updated to ${newStatus}.`);
      fetchTicketDetail();
    } catch (err: any) {
      setError(err.message);
    }
  };

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
      const res = await fetch(`/api/tickets/${ticketId}/attachments`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
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
      const res = await fetch(`/api/attachments/${removingAttachment.id}/remove`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
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

  if (loading) {
    return (
      <div style={{ maxWidth: '1080px', margin: '3rem auto', textAlign: 'center' }}>
        <div style={{ display: 'inline-block', width: '32px', height: '32px', border: '4px solid #005a36', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <p style={{ marginTop: '0.75rem', fontSize: '0.875rem', color: '#64748b' }}>Loading ticket detail...</p>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div style={{ maxWidth: '1080px', margin: '2rem auto', padding: '0 1rem' }}>
        <button onClick={onBack} className="tkt-btn-back" style={{ marginBottom: '1rem' }}>
          ← Back to Queue
        </button>
        <div role="alert" className="tkt-alert-error">
          <span>⚠️</span>
          <div>{error || 'Ticket not found.'}</div>
        </div>
      </div>
    );
  }

  const allowedStatuses = PERMITTED_TRANSITIONS[ticket.currentStatus] || [];
  const publicComments = ticket.publicComments || [];
  const internalNotes = ticket.internalNotes || [];
  const activeAttachments = ticket.attachments?.filter((a) => !a.isRemoved) || [];

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto', padding: '1.5rem 1.25rem' }}>
      {/* Breadcrumb Header */}
      <div className="tkt-breadcrumb-bar">
        <div className="tkt-breadcrumb-text">
          My Queue &gt; <span>Ticket Detail</span>
        </div>
        <button onClick={onBack} className="tkt-btn-back">
          ← Back to Queue
        </button>
      </div>

      {actionMessage && (
        <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', padding: '0.65rem 1rem', borderRadius: '8px', fontSize: '0.825rem', marginBottom: '1rem' }}>
          {actionMessage}
        </div>
      )}

      {/* Main Ticket Card Grid */}
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
              value={ticket.relatedSystem?.name || 'Corporate Laptop'}
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
            <select
              value={ticket.currentStatus}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="tkt-input"
              style={{ fontWeight: 600, color: '#166534', backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }}
            >
              <option value={ticket.currentStatus}>{ticket.currentStatus}</option>
              {allowedStatuses.map((s) => (
                <option key={s} value={s}>→ {s}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 3: Ticket Owner, IT Priority */}
        <div className="tkt-grid-2">
          <div>
            <label className="tkt-label">Ticket Owner</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <select
                onChange={(e) => handleAssign(e.target.value)}
                value={ticket.ownerId ? String(ticket.ownerId) : ''}
                className="tkt-input"
                style={{ flex: 1 }}
              >
                <option value="">{ticket.owner ? ticket.owner.name : 'Unassigned'}</option>
                {staffUsers.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
              {(!ticket.owner || ticket.owner.id !== loggedInUser?.id) && (
                <button
                  onClick={handleClaim}
                  className="tkt-btn-primary"
                  style={{ width: 'auto', padding: '0.5rem 0.9rem', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                >
                  Claim
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="tkt-label">IT Priority</label>
            <select
              value={ticket.itPriority || ticket.requestedPriority}
              onChange={(e) => handlePriorityChange(e.target.value)}
              className="tkt-input"
              style={{ fontWeight: 600 }}
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
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
        <div>
          <label className="tkt-label">Description</label>
          <textarea
            readOnly
            rows={3}
            value={ticket.description}
            className="tkt-input"
            style={{ resize: 'none' }}
          />
        </div>
      </div>

      {/* Attachments Section for Staff */}
      <div className="tkt-detail-card" style={{ marginTop: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
          <span style={{ fontSize: '1.2rem' }}>📎</span>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>
            Attachments ({activeAttachments.length})
          </h3>
        </div>

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
                    📎 {a.originalFilename}
                  </a>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginLeft: '0.5rem' }}>
                    ({(a.sizeBytes / 1024).toFixed(1)} KB)
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

      {/* Communications Grid: Public Comments & Private Internal Notes Side-by-Side */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
        <div className="tkt-detail-card" style={{ margin: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
            <span style={{ fontSize: '1.2rem' }}>💬</span>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>
              Public Comments ({publicComments.length})
            </h3>
            <span className="tkt-pill tkt-pill-status-in-progress" style={{ marginLeft: 'auto', fontSize: '0.7rem' }}>
              Visible to Requester
            </span>
          </div>
          <PublicCommentsSection
            ticketId={ticket.id}
            comments={publicComments}
            onCommentAdded={fetchTicketDetail}
          />
        </div>

        <div className="tkt-detail-card" style={{ margin: 0, backgroundColor: '#fffdfa', borderColor: '#fde68a' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid #fde68a', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
            <span style={{ fontSize: '1.2rem' }}>🔒</span>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#92400e' }}>
              Private Internal Notes ({internalNotes.length})
            </h3>
            <span className="tkt-pill tkt-pill-status-pending" style={{ marginLeft: 'auto', fontSize: '0.7rem' }}>
              IT Staff & Admins Only
            </span>
          </div>
          <InternalNotesSection
            ticketId={ticket.id}
            notes={internalNotes}
            onNoteAdded={fetchTicketDetail}
          />
        </div>
      </div>

      {/* Attachment Soft Removal Modal for Staff */}
      {removingAttachment && (
        <div className="tkt-auth-page" style={{ position: 'fixed', inset: 0, zIndex: 50, backgroundColor: 'rgba(15, 23, 42, 0.65)' }}>
          <div className="tkt-auth-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Confirm Attachment Removal</h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem' }}>
              Are you sure you want to remove <strong>{removingAttachment.originalFilename}</strong>? A reason is required.
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
