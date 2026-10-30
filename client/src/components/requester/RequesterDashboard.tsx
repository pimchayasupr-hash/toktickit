import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

interface RequesterMetrics {
  openTicketsCount: number;
  waitingForRequesterCount: number;
  recentlyResolvedCount: number;
  closedTicketsCount: number;
}

interface RequesterTicketSummary {
  id: number;
  ticketNumber: string;
  summary: string;
  currentStatus: string;
  requestedPriority?: string;
  updatedAt: string;
}

interface RequesterDashboardData {
  metrics: RequesterMetrics;
  attentionTickets: RequesterTicketSummary[];
  recentTickets: RequesterTicketSummary[];
}

interface RequesterDashboardProps {
  onNavigate?: (tab: string, ticketIdOrFilter?: any) => void;
}

export const RequesterDashboard: React.FC<RequesterDashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [data, setData] = useState<RequesterDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequesterData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('toktickit_token') || localStorage.getItem('token');
      const res = await fetch('/api/dashboard/requester', {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {
        throw new Error('Failed to load requester dashboard data.');
      }

      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequesterData();
  }, []);

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'NEW':
        return 'tkt-pill-status-new';
      case 'OPEN':
        return 'tkt-pill-status-open';
      case 'IN_PROGRESS':
        return 'tkt-pill-status-in-progress';
      case 'WAITING_FOR_REQUESTER':
        return 'tkt-pill-status-waiting';
      case 'RESOLVED':
        return 'tkt-pill-status-resolved';
      case 'CLOSED':
        return 'tkt-pill-status-closed';
      case 'REOPENED':
        return 'tkt-pill-status-reopened';
      case 'CANCELLED':
        return 'tkt-pill-status-cancelled';
      default:
        return 'tkt-pill-status-new';
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8" aria-busy="true">
        <div className="flex justify-between items-center mb-6">
          <div className="h-8 bg-slate-200 rounded w-64 animate-pulse"></div>
          <div className="h-8 bg-slate-200 rounded w-24 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-100 border border-slate-200 rounded-xl animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 flex justify-between items-center">
          <div>
            <strong>Error: </strong> {error || 'Unable to load dashboard data.'}
          </div>
          <button
            onClick={fetchRequesterData}
            className="text-sm font-semibold underline hover:text-red-800"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { metrics, attentionTickets, recentTickets } = data;
  const isZeroTicket =
    metrics.openTicketsCount === 0 &&
    metrics.closedTicketsCount === 0 &&
    metrics.waitingForRequesterCount === 0 &&
    metrics.recentlyResolvedCount === 0;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            My Support Dashboard
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Track and manage your IT support requests, <span className="font-semibold">{user?.name}</span>.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchRequesterData}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition shadow-sm"
            title="Refresh dashboard metrics"
          >
            🔄 Refresh
          </button>
          <button
            onClick={() => onNavigate && onNavigate('create-ticket')}
            className="tkt-btn-action-primary"
          >
            ➕ Create New Ticket
          </button>
        </div>
      </div>

      {/* Attention Alert Banner (Conditional if any tickets in WAITING_FOR_REQUESTER) */}
      {metrics.waitingForRequesterCount > 0 && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl mb-8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <h3 className="text-sm font-bold text-amber-900">
                Action Required on Your Tickets
              </h3>
              <p className="text-sm text-amber-800 mt-0.5">
                You have {metrics.waitingForRequesterCount} ticket{metrics.waitingForRequesterCount > 1 ? 's' : ''} awaiting your feedback. Please review IT Staff inquiries and reply to keep investigation moving.
              </p>
            </div>
          </div>
          {attentionTickets && attentionTickets.length > 0 && (
            <button
              onClick={() => onNavigate && onNavigate('ticket-detail', attentionTickets[0].id)}
              className="tkt-btn-attention shadow-sm"
              aria-label={`Review ticket ${attentionTickets[0].ticketNumber} awaiting your feedback`}
            >
              Review Now &rarr;
            </button>
          )}
        </div>
      )}

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Card 1: Open Tickets */}
        <div
          onClick={() => onNavigate && onNavigate('my-tickets')}
          className="bg-white border border-emerald-100 rounded-xl p-5 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col justify-between"
          style={{ borderTop: '4px solid #006B3C' }}
        >
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Open Tickets
            </div>
            <div className="text-3xl font-extrabold text-slate-900">
              {metrics.openTicketsCount}
            </div>
          </div>
          <div className="text-xs text-slate-500 mt-3 flex items-center justify-between">
            <span>In progress or queued</span>
            <span className="text-emerald-700 font-semibold">View &rarr;</span>
          </div>
        </div>

        {/* Card 2: Waiting for Feedback */}
        <div
          onClick={() => onNavigate && onNavigate('my-tickets')}
          className="bg-white border border-amber-100 rounded-xl p-5 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col justify-between"
          style={{ borderTop: '4px solid #f59e0b' }}
        >
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Waiting for My Feedback
            </div>
            <div className="text-3xl font-extrabold text-amber-600">
              {metrics.waitingForRequesterCount}
            </div>
          </div>
          <div className="text-xs text-slate-500 mt-3 flex items-center justify-between">
            <span>Needs your reply</span>
            <span className="text-amber-700 font-semibold">View &rarr;</span>
          </div>
        </div>

        {/* Card 3: Recently Resolved */}
        <div
          onClick={() => onNavigate && onNavigate('my-tickets')}
          className="bg-white border border-emerald-100 rounded-xl p-5 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col justify-between"
          style={{ borderTop: '4px solid #10b981' }}
        >
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Recently Resolved
            </div>
            <div className="text-3xl font-extrabold text-emerald-600">
              {metrics.recentlyResolvedCount}
            </div>
          </div>
          <div className="text-xs text-slate-500 mt-3 flex items-center justify-between">
            <span>Ready for confirmation</span>
            <span className="text-emerald-700 font-semibold">View &rarr;</span>
          </div>
        </div>

        {/* Card 4: Closed Tickets */}
        <div
          onClick={() => onNavigate && onNavigate('my-tickets')}
          className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col justify-between"
          style={{ borderTop: '4px solid #64748b' }}
        >
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Closed Tickets
            </div>
            <div className="text-3xl font-extrabold text-slate-600">
              {metrics.closedTicketsCount}
            </div>
          </div>
          <div className="text-xs text-slate-500 mt-3 flex items-center justify-between">
            <span>Completed requests</span>
            <span className="text-slate-700 font-semibold">View &rarr;</span>
          </div>
        </div>
      </div>

      {/* Recent Tickets Section */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">
            Recent Tickets
          </h2>
          {recentTickets.length > 0 && (
            <button
              onClick={() => onNavigate && onNavigate('my-tickets')}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800"
            >
              View All Tickets &rarr;
            </button>
          )}
        </div>

        {isZeroTicket || recentTickets.length === 0 ? (
          <div className="p-12 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <div className="text-4xl mb-3">🌱</div>
            <h3 className="text-base font-bold text-slate-800">
              No tickets submitted yet
            </h3>
            <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
              Need technical support or assistance? Submit a ticket and our IT Staff will help you right away.
            </p>
            <button
              onClick={() => onNavigate && onNavigate('create-ticket')}
              className="tkt-btn-action-primary mt-4"
            >
              ➕ Create Your First Ticket
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentTickets.map((t) => (
              <div
                key={t.id}
                onClick={() => onNavigate && onNavigate('ticket-detail', t.id)}
                className="py-3.5 hover:bg-slate-50 px-2 rounded-lg transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-emerald-800">
                      {t.ticketNumber}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${getStatusBadgeClass(t.currentStatus)}`}>
                      {t.currentStatus}
                    </span>
                  </div>
                  <div className="text-sm font-medium text-slate-900 mt-1">
                    {t.summary}
                  </div>
                </div>
                <div className="text-xs text-slate-500">
                  Updated {new Date(t.updatedAt).toLocaleDateString('th-TH', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
