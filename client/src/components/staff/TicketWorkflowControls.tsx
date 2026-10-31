import React, { useState } from 'react';

const VALID_TRANSITIONS: Record<string, string[]> = {
  NEW: ['OPEN', 'IN_PROGRESS', 'CANCELLED'],
  OPEN: ['IN_PROGRESS', 'WAITING_FOR_REQUESTER', 'RESOLVED', 'CANCELLED'],
  IN_PROGRESS: ['WAITING_FOR_REQUESTER', 'RESOLVED', 'CANCELLED', 'OPEN'],
  WAITING_FOR_REQUESTER: ['IN_PROGRESS', 'RESOLVED', 'CANCELLED'],
  RESOLVED: ['CLOSED', 'REOPENED'],
  REOPENED: ['IN_PROGRESS', 'CANCELLED'],
  CLOSED: [],
  CANCELLED: [],
};

interface TicketWorkflowProps {
  ticket: {
    id: number;
    ticketNumber: string;
    currentStatus: string;
    ownerId?: number | null;
    version?: number;
    actionsCount?: number;
    hasActionWithResult?: boolean;
  };
  onStatusChanged?: (updatedTicket: any) => void;
}

export const TicketWorkflowControls: React.FC<TicketWorkflowProps> = ({
  ticket,
  onStatusChanged,
}) => {
  const allowedTransitions = VALID_TRANSITIONS[ticket.currentStatus] || [];
  const [selectedStatus, setSelectedStatus] = useState<string>(
    allowedTransitions[0] || ''
  );
  const [updating, setUpdating] = useState<boolean>(false);
  const [gateWarning, setGateWarning] = useState<string | null>(null);
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);

  const handleUpdateStatus = async () => {
    if (!selectedStatus) return;

    setGateWarning(null);
    setConflictWarning(null);

    // Front-end Resolution Gate check
    if (selectedStatus === 'RESOLVED') {
      if (!ticket.ownerId) {
        setGateWarning(
          'Resolution Gate: Ticket must be claimed by or assigned to an IT Staff member before resolving.'
        );
        return;
      }
      if (ticket.actionsCount !== undefined && ticket.actionsCount === 0) {
        setGateWarning(
          'Resolution Gate: At least one Action Taken must be recorded before resolving.'
        );
        return;
      }
      if (ticket.hasActionWithResult !== undefined && !ticket.hasActionWithResult) {
        setGateWarning(
          'Resolution Gate: At least one Action Taken must have a non-empty result before resolving.'
        );
        return;
      }
    }

    setUpdating(true);
    try {
      const token = localStorage.getItem('toktickit_token') || localStorage.getItem('token');
      const res = await fetch(`/api/staff/tickets/${ticket.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          status: selectedStatus,
          version: ticket.version || 1,
        }),
      });

      if (res.status === 409) {
        setConflictWarning(
          'Concurrency conflict: Ticket was modified by another user. Please reload the latest data.'
        );
        return;
      }

      const json = await res.json();
      if (!res.ok) {
        setGateWarning(json.error?.message || 'Failed to update ticket status.');
        return;
      }

      if (onStatusChanged) {
        onStatusChanged(json.ticket);
      }
    } catch (err: any) {
      setGateWarning(err.message || 'An unexpected error occurred.');
    } finally {
      setUpdating(false);
    }
  };

  if (allowedTransitions.length === 0) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-500 text-center">
        Ticket is in terminal state ({ticket.currentStatus}). No further transitions allowed.
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <svg width="16" height="16" className="w-4 h-4 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Workflow Transitions
        </h3>
        <span className="text-xs text-slate-500 font-mono">
          Current: <strong>{ticket.currentStatus}</strong>
        </span>
      </div>

      {gateWarning && (
        <div className="bg-red-50 text-red-700 text-xs p-3 rounded-lg border border-red-200 flex items-start gap-2">
          <svg width="16" height="16" className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>{gateWarning}</div>
        </div>
      )}

      {conflictWarning && (
        <div className="bg-amber-50 text-amber-900 text-xs p-3 rounded-lg border border-amber-300 flex items-start gap-2">
          <svg width="16" height="16" className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>{conflictWarning}</div>
        </div>
      )}

      <div>
        <label
          htmlFor="targetStatusSelect"
          className="block text-xs font-semibold text-slate-700 mb-1"
        >
          Select Next Status:
        </label>
        <select
          id="targetStatusSelect"
          value={selectedStatus}
          onChange={(e) => {
            setSelectedStatus(e.target.value);
            setGateWarning(null);
          }}
          className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          {allowedTransitions.map((st) => (
            <option key={st} value={st}>
              &rarr; {st.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
      </div>

      {selectedStatus === 'RESOLVED' && (
        <div className="text-[11px] bg-emerald-50 text-emerald-800 p-2.5 rounded-lg border border-emerald-100">
          <strong>Resolution Gate Active:</strong> Requires an assigned IT Staff owner and at least one Action Taken with a documented result.
        </div>
      )}

      <button
        onClick={handleUpdateStatus}
        disabled={updating || !selectedStatus}
        className="w-full tkt-btn-action-primary"
      >
        {updating ? 'Updating...' : 'Update Status'}
      </button>
    </div>
  );
};
