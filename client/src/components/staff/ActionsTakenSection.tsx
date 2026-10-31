import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import type { ActionTaken, ActionStatus, User } from '../../types';

interface ActionsTakenSectionProps {
  ticketId: number;
  isReadOnly?: boolean;
  onActionsUpdated?: () => void;
}

const getLocalDatetimeString = (date = new Date()) => {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

const getStatusBadge = (status: ActionStatus) => {
  switch (status) {
    case 'COMPLETED':
      return {
        label: 'Completed',
        className: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        icon: null,
      };
    case 'IN_PROGRESS':
      return {
        label: 'In Progress',
        className: 'bg-blue-100 text-blue-800 border-blue-300',
        icon: null,
      };
    case 'CANCELLED':
      return {
        label: 'Cancelled',
        className: 'bg-rose-100 text-rose-800 border-rose-300',
        icon: null,
      };
    case 'PENDING':
    default:
      return {
        label: 'Pending',
        className: 'bg-slate-100 text-slate-700 border-slate-300',
        icon: null,
      };
  }
};

export const ActionsTakenSection: React.FC<ActionsTakenSectionProps> = ({
  ticketId,
  isReadOnly = false,
  onActionsUpdated,
}) => {
  const { user } = useAuth();
  const [actions, setActions] = useState<ActionTaken[]>([]);
  const [assignees, setAssignees] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingActionId, setEditingActionId] = useState<number | null>(null);
  const [actionDateTime, setActionDateTime] = useState<string>(getLocalDatetimeString());
  const [description, setDescription] = useState<string>('');
  const [result, setResult] = useState<string>('');
  const [status, setStatus] = useState<ActionStatus>('PENDING');
  const [assigneeId, setAssigneeId] = useState<string>('');
  const [followUpRequired, setFollowUpRequired] = useState<boolean>(false);
  const [followUpNote, setFollowUpNote] = useState<string>('');
  const [attachmentNotes, setAttachmentNotes] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);

  const fetchActions = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('toktickit_token') || localStorage.getItem('token');
      const res = await fetch(`/api/tickets/${ticketId}/actions-taken`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {
        throw new Error('Failed to load actions taken.');
      }

      const data = await res.json();
      setActions(data.actionsTaken || []);
    } catch (err: any) {
      setError(err.message || 'Error loading actions taken.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignees = async () => {
    if (isReadOnly) return;
    try {
      const token = localStorage.getItem('toktickit_token') || localStorage.getItem('token');
      const res = await fetch('/api/staff/assignees', {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (res.ok) {
        const data = await res.json();
        setAssignees(data.assignees || data.users || []);
      }
    } catch {
      // Ignore background assignee load error
    }
  };

  useEffect(() => {
    fetchActions();
    fetchAssignees();
  }, [ticketId]);

  const resetForm = () => {
    setShowForm(false);
    setEditingActionId(null);
    setActionDateTime(getLocalDatetimeString());
    setDescription('');
    setResult('');
    setStatus('PENDING');
    setAssigneeId('');
    setFollowUpRequired(false);
    setFollowUpNote('');
    setAttachmentNotes('');
    setFormError(null);
    setConflictWarning(null);
  };

  const handleOpenAddForm = () => {
    resetForm();
    setShowForm(true);
  };

  const handleOpenEditForm = (action: ActionTaken) => {
    if (action.status === 'COMPLETED' || action.status === 'CANCELLED') {
      return;
    }
    resetForm();
    setEditingActionId(action.id);
    setActionDateTime(getLocalDatetimeString(new Date(action.actionDateTime)));
    setDescription(action.description);
    setResult(action.result || '');
    setStatus(action.status || 'PENDING');
    setAssigneeId(action.assigneeId ? String(action.assigneeId) : '');
    setFollowUpRequired(action.followUpRequired);
    setFollowUpNote(action.followUpNote || '');
    setAttachmentNotes(action.attachmentNotes || '');
    setShowForm(true);
  };

  const handleQuickTransition = async (action: ActionTaken, nextStatus: ActionStatus) => {
    if (action.status === 'COMPLETED' || action.status === 'CANCELLED') {
      return;
    }

    if (nextStatus === 'COMPLETED' && (!action.result || !action.result.trim())) {
      // Need result to complete: open edit form with status set to COMPLETED
      handleOpenEditForm(action);
      setStatus('COMPLETED');
      setFormError('Result is required to complete this action. Please record the outcome below.');
      return;
    }

    try {
      const token = localStorage.getItem('toktickit_token') || localStorage.getItem('token');
      const res = await fetch(`/api/tickets/${ticketId}/actions-taken/${action.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          version: action.version,
          status: nextStatus,
        }),
      });

      if (res.status === 409) {
        alert('Conflict detected: This action was modified by another staff member. Reloading latest data.');
        await fetchActions();
        return;
      }

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        alert(errJson.error?.message || 'Failed to update action status.');
        return;
      }

      await fetchActions();
      if (onActionsUpdated) {
        onActionsUpdated();
      }
    } catch (err: any) {
      alert(err.message || 'Error updating action status.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setConflictWarning(null);

    // Validation
    if (!description.trim()) {
      setFormError('Action description is required.');
      return;
    }
    if (description.trim().length < 5) {
      setFormError('Action description must be at least 5 characters.');
      return;
    }
    if (status === 'COMPLETED' && !result.trim()) {
      setFormError('Result is required when completing an Action Taken.');
      return;
    }
    if (followUpRequired && !followUpNote.trim()) {
      setFormError('Follow-up note is required when follow-up is checked.');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('toktickit_token') || localStorage.getItem('token');
      const payload: any = {
        actionDateTime: new Date(actionDateTime).toISOString(),
        description: description.trim(),
        result: result.trim() || null,
        status,
        assigneeId: assigneeId ? parseInt(assigneeId, 10) : null,
        followUpRequired,
        followUpNote: followUpRequired ? followUpNote.trim() : null,
        attachmentNotes: attachmentNotes.trim() || null,
      };

      let res: Response;

      if (editingActionId) {
        const targetAction = actions.find((a) => a.id === editingActionId);
        payload.version = targetAction?.version || 1;

        res = await fetch(`/api/tickets/${ticketId}/actions-taken/${editingActionId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`/api/tickets/${ticketId}/actions-taken`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(payload),
        });
      }

      if (res.status === 409) {
        setConflictWarning(
          'Conflict detected: This action was modified by another staff member while you were editing. Please review the latest data.'
        );
        return;
      }

      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson.error?.message || 'Failed to save action taken.');
      }

      resetForm();
      await fetchActions();
      if (onActionsUpdated) {
        onActionsUpdated();
      }
    } catch (err: any) {
      setFormError(err.message || 'An error occurred while saving.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm mt-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <svg width="20" height="20" className="w-5 h-5 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Actions Taken ({actions.length})
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Formal audit trail of operational diagnostic and remediation tasks, status transitions, and assigned work.
          </p>
        </div>

        {!isReadOnly && !showForm && (
          <button
            onClick={handleOpenAddForm}
            className="tkt-btn-action-primary"
          >
            + Add Action
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg border border-red-200 mb-4">
          {error}
        </div>
      )}

      {/* Form (Add or Edit) */}
      {showForm && !isReadOnly && (
        <form
          onSubmit={handleSubmit}
          noValidate
          className="bg-slate-50 border border-emerald-200 rounded-xl p-5 mb-6 shadow-sm space-y-4"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">
              {editingActionId ? 'Edit Action Taken' : 'Record New Action Taken'}
            </h3>
            <button
              type="button"
              onClick={resetForm}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              ✕ Cancel
            </button>
          </div>

          {formError && (
            <div className="bg-red-50 text-red-700 text-xs p-3 rounded-lg border border-red-200">
              {formError}
            </div>
          )}

          {conflictWarning && (
            <div role="alert" className="tkt-alert-error" style={{ marginBottom: '1rem', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <svg width="20" height="20" className="w-5 h-5 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <strong>HTTP 409 Conflict:</strong> {conflictWarning}
                </div>
              </div>
              <button
                type="button"
                onClick={fetchActions}
                className="underline font-bold text-red-900 ml-2 text-xs"
              >
                Reload Latest Data
              </button>
            </div>
          )}

          {/* Row: Date Time, Status, Assignee */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label
                htmlFor="actionDateTime"
                className="block text-xs font-bold text-slate-700 mb-1"
              >
                Action Date &amp; Time <span className="text-red-500">*</span>
              </label>
              <input
                id="actionDateTime"
                type="datetime-local"
                value={actionDateTime}
                onChange={(e) => setActionDateTime(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label
                htmlFor="actionStatus"
                className="block text-xs font-bold text-slate-700 mb-1"
              >
                Action Status <span className="text-red-500">*</span>
              </label>
              <select
                id="actionStatus"
                value={status}
                onChange={(e) => setStatus(e.target.value as ActionStatus)}
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
              >
                <option value="PENDING">⏳ Pending</option>
                <option value="IN_PROGRESS">⚙ In Progress</option>
                <option value="COMPLETED">✓ Completed</option>
                {editingActionId && <option value="CANCELLED">✕ Cancelled</option>}
              </select>
            </div>

            <div>
              <label
                htmlFor="actionAssignee"
                className="block text-xs font-bold text-slate-700 mb-1"
              >
                Operational Assignee
              </label>
              <select
                id="actionAssignee"
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">(Unassigned / Current Staff)</option>
                {assignees.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Action Description */}
          <div>
            <label
              htmlFor="actionDescription"
              className="block text-xs font-bold text-slate-700 mb-1"
            >
              Action Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="actionDescription"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe technical step performed (e.g., Checked fiber transceiver power level, replaced patch cable)..."
              className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
            <div className="text-right text-[11px] text-slate-400 mt-0.5">
              {description.length} / 2000 chars
            </div>
          </div>

          {/* Action Result */}
          <div>
            <label
              htmlFor="actionResult"
              className="block text-xs font-bold text-slate-700 mb-1"
            >
              Action Result {status === 'COMPLETED' && <span className="text-red-500">* (Required for Completed actions)</span>}
            </label>
            <textarea
              id="actionResult"
              rows={2}
              value={result}
              onChange={(e) => setResult(e.target.value)}
              placeholder={status === 'COMPLETED' ? "Observed outcome or measurement (Required to complete action)..." : "Observed outcome or measurement (Optional while pending/in-progress)..."}
              className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <div className="text-right text-[11px] text-slate-400 mt-0.5">
              {result.length} / 1000 chars
            </div>
          </div>

          {/* Follow-up Checkbox */}
          <div className="flex items-center gap-2 pt-1">
            <input
              id="followUpRequired"
              type="checkbox"
              checked={followUpRequired}
              onChange={(e) => setFollowUpRequired(e.target.checked)}
              className="h-4 w-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
            />
            <label
              htmlFor="followUpRequired"
              className="text-xs font-bold text-slate-800 cursor-pointer"
            >
              Follow-Up Required
            </label>
          </div>

          {/* Follow-up Note */}
          {followUpRequired && (
            <div>
              <label
                htmlFor="followUpNote"
                className="block text-xs font-bold text-slate-700 mb-1"
              >
                Follow-Up Note <span className="text-red-500">*</span>
              </label>
              <textarea
                id="followUpNote"
                rows={2}
                value={followUpNote}
                onChange={(e) => setFollowUpNote(e.target.value)}
                placeholder="Specify what requires further attention or monitoring..."
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
          )}

          {/* Attachment Notes */}
          <div>
            <label
              htmlFor="attachmentNotes"
              className="block text-xs font-bold text-slate-700 mb-1"
            >
              Attachment Notes (Optional)
            </label>
            <input
              id="attachmentNotes"
              type="text"
              value={attachmentNotes}
              onChange={(e) => setAttachmentNotes(e.target.value)}
              placeholder="References to external documents or logs (e.g., Optical power meter screenshot)"
              className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="tkt-btn-action-primary"
            >
              {submitting ? 'Saving...' : editingActionId ? 'Update Action' : 'Save Action'}
            </button>
          </div>
        </form>
      )}

      {/* Actions List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 bg-slate-50 rounded-xl animate-pulse"></div>
          ))}
        </div>
      ) : actions.length === 0 ? (
        <div className="p-8 text-center text-slate-500 text-sm bg-slate-50 rounded-xl border border-dashed border-slate-200">
          No actions taken yet.
        </div>
      ) : (
        <div className="space-y-4">
          {actions.map((act) => {
            const isTerminal = act.status === 'COMPLETED' || act.status === 'CANCELLED';
            const canEdit =
              !isReadOnly &&
              !isTerminal &&
              (user?.role === 'ADMIN' || (user?.role === 'STAFF' && user?.id === act.performedById));

            const badge = getStatusBadge(act.status);

            return (
              <div
                key={act.id}
                className="tkt-action-card border border-slate-200 rounded-xl p-4 bg-white hover:border-emerald-200 transition"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Status Badge */}
                    <span
                      className={`tkt-action-status-badge text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${badge.className} flex items-center gap-1`}
                    >
                      {badge.icon && <span>{badge.icon}</span>}
                      <span>{badge.label}</span>
                    </span>

                    <span className="text-xs text-slate-400">•</span>

                    {/* Performer */}
                    <span className="text-xs font-semibold text-slate-800">
                      Performed by: {act.performedBy?.name || 'IT Staff'}
                    </span>

                    {/* Assignee if present */}
                    {act.assignee && (
                      <>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs text-emerald-800 font-medium bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                          👤 Assignee: {act.assignee.name}
                        </span>
                      </>
                    )}

                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-500">
                      {new Date(act.actionDateTime).toLocaleString('th-TH', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>

                    {act.followUpRequired && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                        Follow-up Required
                      </span>
                    )}

                    {isTerminal && (
                      <span className="text-[10px] font-medium text-slate-400 italic">
                        (Terminal / Immutable)
                      </span>
                    )}
                  </div>

                  {/* Action Controls */}
                  <div className="flex items-center gap-2">
                    {!isReadOnly && !isTerminal && (
                      <>
                        {act.status === 'PENDING' && (
                          <button
                            type="button"
                            onClick={() => handleQuickTransition(act, 'IN_PROGRESS')}
                            className="text-xs font-semibold px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded border border-blue-200 transition"
                          >
                            ⚙ Start Work
                          </button>
                        )}
                        {(act.status === 'PENDING' || act.status === 'IN_PROGRESS') && (
                          <button
                            type="button"
                            onClick={() => handleQuickTransition(act, 'COMPLETED')}
                            className="text-xs font-semibold px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded border border-emerald-200 transition"
                          >
                            ✓ Complete
                          </button>
                        )}
                        {(act.status === 'PENDING' || act.status === 'IN_PROGRESS') && (
                          <button
                            type="button"
                            onClick={() => handleQuickTransition(act, 'CANCELLED')}
                            className="text-xs font-semibold px-2 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded border border-rose-200 transition"
                          >
                            ✕ Cancel
                          </button>
                        )}
                        {canEdit && (
                          <button
                            onClick={() => handleOpenEditForm(act)}
                            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 underline ml-1"
                          >
                            Edit
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div className="text-sm text-slate-800 mt-2 font-medium">
                  {act.description}
                </div>

                {/* Result */}
                {act.result && (
                  <div className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-lg p-2.5 mt-2">
                    <strong className="text-emerald-900">Result:</strong> {act.result}
                  </div>
                )}

                {/* Follow-up Note */}
                {act.followUpRequired && act.followUpNote && (
                  <div className="text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded-lg p-2.5 mt-2">
                    <strong className="text-amber-950">Follow-up Note:</strong> {act.followUpNote}
                  </div>
                )}

                {/* Attachment Notes */}
                {act.attachmentNotes && (
                  <div className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg p-2 mt-2 font-mono">
                    📎 {act.attachmentNotes}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
