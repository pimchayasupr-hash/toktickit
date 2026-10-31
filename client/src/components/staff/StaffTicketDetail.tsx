import React, { useState, useEffect } from 'react';
import type { Ticket, User, Attachment } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { PublicCommentsSection } from '../comments/PublicCommentsSection';
import { InternalNotesSection } from '../comments/InternalNotesSection';
import { ActionsTakenSection } from './ActionsTakenSection';

interface StaffTicketDetailProps {
  ticketId: number;
  onBack: () => void;
}

const STATUS_LABELS: Record<string, string> = {
  NEW: 'New',
  OPEN: 'Open',
  IN_PROGRESS: 'In Progress',
  WAITING_FOR_REQUESTER: 'Waiting for Requester',
  PENDING: 'Pending',
  RESOLVED: 'Resolved',
  CANCELLED: 'Cancelled',
  CLOSED: 'Closed',
  REOPENED: 'Reopened',
};

const PRIORITY_LABELS: Record<string, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  URGENT: 'Urgent',
};

const getPriorityBadgeClass = (priority?: string) => {
  switch (priority) {
    case 'URGENT':
      return 'tkt-pill-priority-urgent';
    case 'HIGH':
      return 'tkt-pill-priority-high';
    case 'MEDIUM':
      return 'tkt-pill-priority-medium';
    default:
      return 'tkt-pill-priority-low';
  }
};

const PERMITTED_TRANSITIONS: Record<string, string[]> = {
  NEW: ['OPEN', 'IN_PROGRESS', 'CANCELLED'],
  OPEN: ['IN_PROGRESS', 'WAITING_FOR_REQUESTER', 'RESOLVED', 'CANCELLED'],
  IN_PROGRESS: ['WAITING_FOR_REQUESTER', 'RESOLVED', 'CANCELLED'],
  WAITING_FOR_REQUESTER: ['IN_PROGRESS', 'RESOLVED', 'CANCELLED'],
  RESOLVED: ['CLOSED', 'REOPENED'],
  CLOSED: ['REOPENED'],
  REOPENED: ['IN_PROGRESS', 'WAITING_FOR_REQUESTER', 'RESOLVED', 'CANCELLED'],
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
  const [statusError, setStatusError] = useState<string | null>(null);

  // File Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

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
      const res = await fetch('/api/staff/assignees', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStaffUsers(data.assignees || data.users || []);
      }
    } catch {}
  };

  const handleClaim = async () => {
    setActionMessage(null);
    setStatusError(null);
    try {
      const res = await fetch(`/api/staff/tickets/${ticketId}/claim`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to claim ticket.');
      setActionMessage('Successfully claimed ticket ownership.');
      fetchTicketDetail();
    } catch (err: any) {
      setStatusError(err.message);
    }
  };

  const handleAssign = async (targetOwnerId: string) => {
    setActionMessage(null);
    setStatusError(null);
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
      setStatusError(err.message);
    }
  };

  const handlePriorityChange = async (newPriority: string) => {
    setActionMessage(null);
    setStatusError(null);
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
      setStatusError(err.message);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    setActionMessage(null);
    setStatusError(null);
    try {
      const res = await fetch(`/api/staff/tickets/${ticketId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus, version: ticket?.version }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || 'Invalid status transition.');
      }
      setActionMessage(`Ticket status updated to ${newStatus}.`);
      fetchTicketDetail();
    } catch (err: any) {
      setStatusError(err.message);
    }
  };

  const handleDownloadAttachment = async (attachmentId: number, filename: string) => {
    setDownloadError(null);
    try {
      const res = await fetch(`/api/attachments/${attachmentId}/download`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        let errorMsg = `Download failed (${res.status})`;
        try {
          const data = await res.json();
          if (data?.error?.message) errorMsg = data.error.message;
        } catch (_) {}
        throw new Error(errorMsg);
      }
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const tempLink = document.createElement('a');
      tempLink.href = blobUrl;
      tempLink.download = filename;
      document.body.appendChild(tempLink);
      tempLink.click();
      window.URL.revokeObjectURL(blobUrl);
      document.body.removeChild(tempLink);
    } catch (err: any) {
      setDownloadError(err?.message || 'Failed to download attachment. Please try again.');
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
        <div style={{ display: 'inline-block', width: '32px', height: '32px', border: '4px solid #006B3C', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <p style={{ marginTop: '0.75rem', fontSize: '0.875rem', color: '#64748b' }}>Loading ticket detail...</p>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div style={{ maxWidth: '1080px', margin: '2rem auto', padding: '0 1rem' }}>
        <button onClick={onBack} className="tkt-btn-back" style={{ marginBottom: '1rem' }}>
          ← Back to Ticket Queue
        </button>
        <div role="alert" className="tkt-alert-error">
          <svg width="20" height="20" className="w-5 h-5 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
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
          Ticket Queue &gt; <span>Ticket Detail</span>
        </div>
        <button onClick={onBack} className="tkt-btn-back">
          ← Back to Ticket Queue
        </button>
      </div>

      {actionMessage && (
        <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', padding: '0.65rem 1rem', borderRadius: '8px', fontSize: '0.825rem', marginBottom: '1rem' }}>
          {actionMessage}
        </div>
      )}

      {statusError && (
        <div role="alert" className="tkt-alert-error" style={{ marginBottom: '1rem' }}>
          <svg width="20" height="20" className="w-5 h-5 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>{statusError}</div>
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
              style={{ backgroundColor: '#f8fafc', color: '#006B3C', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}
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
              <span className={`tkt-pill ${getPriorityBadgeClass(ticket.requestedPriority)}`}>
                {PRIORITY_LABELS[ticket.requestedPriority] || ticket.requestedPriority}
              </span>
            </div>
          </div>

          <div>
            <label htmlFor="ticketStatusSelect" className="tkt-label">Current Status</label>
            <select
              id="ticketStatusSelect"
              value={ticket.currentStatus}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="tkt-input"
              style={{ fontWeight: 600, color: '#166534', backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }}
            >
              <option value={ticket.currentStatus}>{STATUS_LABELS[ticket.currentStatus] || ticket.currentStatus}</option>
              {allowedStatuses.map((s) => (
                <option key={s} value={s}>→ {STATUS_LABELS[s] || s}</option>
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

      {/* Actions Taken Section for Staff */}
      <ActionsTakenSection
        ticketId={ticket.id}
        isReadOnly={false}
        onActionsUpdated={fetchTicketDetail}
      />

      {/* Append-only Status History Timeline (Part 7) */}
      <div className="tkt-detail-card" style={{ marginTop: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
          <svg width="18" height="18" className="w-4 h-4 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>
            Ticket Status History ({ticket.statusHistory?.length || 0})
          </h3>
          <span className="tkt-pill tkt-pill-status-in-progress" style={{ marginLeft: 'auto', fontSize: '0.7rem' }}>
            Append-Only Audit Log
          </span>
        </div>

        {!ticket.statusHistory || ticket.statusHistory.length === 0 ? (
          <p style={{ fontSize: '0.85rem', color: '#94a3b8', fontStyle: 'italic' }}>
            No status transitions recorded yet. Ticket created in status {ticket.currentStatus}.
          </p>
        ) : (
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {ticket.statusHistory.map((hist) => (
              <div
                key={hist.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem 1rem',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 600, color: '#475569' }}>{hist.fromStatus}</span>
                  <span style={{ color: '#006B3C', fontWeight: 700 }}>→</span>
                  <span style={{ fontWeight: 700, color: '#006B3C' }}>{hist.toStatus}</span>
                  <span style={{ color: '#94a3b8' }}>•</span>
                  <span style={{ color: '#334155', fontWeight: 500 }}>
                    by {hist.changedBy?.name || 'Staff'} ({hist.changedBy?.role || 'STAFF'})
                  </span>
                </div>
                <div style={{ color: '#64748b', fontSize: '0.75rem' }}>
                  {new Date(hist.changedAt).toLocaleString('en-GB', {
                    timeZone: 'Asia/Bangkok',
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Attachments Section for Staff */}
      <div className="tkt-detail-card" style={{ marginTop: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
          <svg width="18" height="18" className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
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

        {downloadError && (
          <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '0.65rem', borderRadius: '8px', fontSize: '0.825rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }} role="alert">
            <svg width="16" height="16" className="w-4 h-4 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{downloadError}</span>
          </div>
        )}

        <div style={{ display: 'grid', gap: '0.5rem' }}>
          {activeAttachments.length === 0 ? (
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', fontStyle: 'italic' }}>No active attachments.</p>
          ) : (
            activeAttachments.map((a) => (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                <div>
                  <button
                    type="button"
                    onClick={() => handleDownloadAttachment(a.id, a.originalFilename)}
                    style={{ background: 'none', border: 'none', padding: 0, color: '#006B3C', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    {a.originalFilename}
                  </button>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginLeft: '0.5rem' }}>
                    ({(a.sizeBytes / 1024).toFixed(1)} KB)
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => handleDownloadAttachment(a.id, a.originalFilename)}
                    style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem', fontWeight: 600, color: '#006B3C', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '6px', cursor: 'pointer' }}
                  >
                    Download
                  </button>
                  <button
                    onClick={() => setRemovingAttachment(a)}
                    style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', color: '#dc2626', background: 'none', border: '1px solid #fca5a5', borderRadius: '6px', cursor: 'pointer' }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Communications Grid: Public Comments & Private Internal Notes Side-by-Side */}
      <div data-testid="communications-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
        <div className="tkt-detail-card" style={{ margin: 0, borderTop: '4px solid #006B3C' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
            <svg width="18" height="18" className="w-4 h-4 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>
              Public Comments ({publicComments.length})
            </h3>
            <span className="tkt-pill tkt-pill-status-in-progress" style={{ marginLeft: 'auto', fontSize: '0.7rem' }}>
              SHARED • Visible to Requester
            </span>
          </div>
          <PublicCommentsSection
            ticketId={ticket.id}
            comments={publicComments}
            onCommentAdded={fetchTicketDetail}
          />
        </div>

        <InternalNotesSection
          ticketId={ticket.id}
          notes={internalNotes}
          onNoteAdded={fetchTicketDetail}
        />
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
