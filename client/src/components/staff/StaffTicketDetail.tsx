import React, { useState, useEffect } from 'react';
import type { Ticket, User } from '../../types';
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
        throw new Error(data.error?.message || 'Failed to update status.');
      }

      setActionMessage(`Ticket status updated to ${newStatus}.`);
      fetchTicketDetail();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-emerald-600 border-t-transparent"></div>
        <p className="mt-3 text-sm text-slate-500">Loading ticket detail...</p>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <button onClick={onBack} className="mb-4 text-xs font-semibold text-emerald-800 hover:underline">
          ← Back to Queue
        </button>
        <div role="alert" className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm">
          {error || 'Ticket not found.'}
        </div>
      </div>
    );
  }

  const allowedStatuses = PERMITTED_TRANSITIONS[ticket.currentStatus] || [];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Back button */}
      <button onClick={onBack} className="text-xs font-semibold text-[#005a36] hover:text-[#008751] flex items-center gap-1">
        ← Back to Ticket Queue
      </button>

      {/* Header Banner */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
              {ticket.ticketNumber}
            </span>
            <h2 className="text-xl font-bold text-slate-900 mt-2">{ticket.summary}</h2>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {/* Status Change */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500">Status:</span>
              <select
                value={ticket.currentStatus}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="p-1.5 border border-slate-300 rounded-lg text-xs font-semibold bg-slate-50 focus:ring-2 focus:ring-emerald-600"
              >
                <option value={ticket.currentStatus}>{ticket.currentStatus}</option>
                {allowedStatuses.map((s) => (
                  <option key={s} value={s}>→ {s}</option>
                ))}
              </select>
            </div>

            {/* IT Priority */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500">IT Priority:</span>
              <select
                value={ticket.itPriority || ticket.requestedPriority}
                onChange={(e) => handlePriorityChange(e.target.value)}
                className="p-1.5 border border-slate-300 rounded-lg text-xs font-semibold bg-slate-50 focus:ring-2 focus:ring-emerald-600"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>
        </div>

        {/* Claim / Reassign Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200 gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Ticket Owner:</span>
            {ticket.owner ? (
              <span className="font-bold text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200">
                👤 {ticket.owner.name}
              </span>
            ) : (
              <span className="italic text-slate-400">Unassigned</span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {(!ticket.owner || ticket.owner.id !== loggedInUser?.id) && (
              <button
                onClick={handleClaim}
                className="px-3 py-1.5 bg-[#005a36] hover:bg-[#008751] text-white font-semibold rounded-lg shadow-sm"
              >
                Claim Ownership
              </button>
            )}

            <select
              onChange={(e) => handleAssign(e.target.value)}
              value={ticket.ownerId ? String(ticket.ownerId) : ''}
              className="p-1.5 border border-slate-300 rounded-lg text-xs bg-white"
            >
              <option value="">Reassign Owner...</option>
              {staffUsers.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>
        </div>

        {actionMessage && (
          <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-2 rounded-lg text-xs font-medium">
            ✅ {actionMessage}
          </div>
        )}
      </div>

      {/* Ticket Details & Attachments Grid */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
        <h3 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-2">Ticket Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block font-medium">Requester</span>
            <span className="font-semibold text-slate-800">{ticket.requester.name} ({ticket.requester.email})</span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Category</span>
            <span className="font-semibold text-slate-800">{ticket.category.name}</span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Related System</span>
            <span className="font-semibold text-slate-800">{ticket.relatedSystem.name}</span>
          </div>
        </div>

        <div>
          <span className="text-xs text-slate-400 block font-medium mb-1">Description</span>
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-sm text-slate-800 whitespace-pre-wrap">
            {ticket.description}
          </div>
        </div>

        {ticket.attachments && ticket.attachments.length > 0 && (
          <div>
            <span className="text-xs text-slate-400 block font-medium mb-2">Attachments ({ticket.attachments.length})</span>
            <div className="space-y-2">
              {ticket.attachments.map((att) => (
                <div key={att.id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                  <span className="font-medium text-slate-700">📎 {att.originalFilename} ({(att.sizeBytes / 1024).toFixed(1)} KB)</span>
                  {att.isRemoved ? (
                    <span className="text-red-600 italic">Removed: {att.removalReason}</span>
                  ) : (
                    <a
                      href={`/api/attachments/${att.id}/download`}
                      download
                      className="text-emerald-700 font-semibold hover:underline"
                    >
                      Download
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Communications Grid: Public Comments & Internal Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PublicCommentsSection
          ticketId={ticket.id}
          comments={ticket.publicComments || []}
          onCommentAdded={fetchTicketDetail}
        />
        <InternalNotesSection
          ticketId={ticket.id}
          notes={ticket.internalNotes || []}
          onNoteAdded={fetchTicketDetail}
        />
      </div>
    </div>
  );
};
