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

  const formatStatus = (st: string) => {
    return st
      .split('_')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Modern Dashboard Hero Header */}
      <div className="tkt-dash-hero">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-100/70 text-emerald-800 text-xs font-semibold mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
            IT Service Portal
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            My Support Dashboard
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Welcome, <span className="font-semibold text-slate-900">{user?.name}</span>! Here's the latest overview on your support requests and inquiries.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchRequesterData}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition shadow-sm"
            title="Refresh dashboard metrics"
          >
            <svg width="14" height="14" className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
          <button
            onClick={() => onNavigate && onNavigate('create-ticket')}
            className="tkt-btn-action-primary inline-flex items-center gap-2"
          >
            <svg width="16" height="16" className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Create Ticket
          </button>
        </div>
      </div>

      {/* Attention Alert Banner (Conditional if any tickets in WAITING_FOR_REQUESTER) */}
      {metrics.waitingForRequesterCount > 0 && (
        <div className="bg-amber-50/90 border border-amber-300 p-4 rounded-2xl mb-8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg width="20" height="20" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-900">
                Action Required on Your Tickets
              </h3>
              <p className="text-xs text-amber-800 mt-0.5">
                You have {metrics.waitingForRequesterCount} ticket{metrics.waitingForRequesterCount > 1 ? 's' : ''} awaiting your feedback. Please review IT Staff inquiries and reply to keep investigation moving.
              </p>
            </div>
          </div>
          {attentionTickets && attentionTickets.length > 0 && (
            <button
              onClick={() => onNavigate && onNavigate('ticket-detail', attentionTickets[0].id)}
              className="tkt-btn-attention shadow-sm whitespace-nowrap self-end sm:self-center"
              aria-label={`Review ticket ${attentionTickets[0].ticketNumber} awaiting your feedback`}
            >
              Review Now &rarr;
            </button>
          )}
        </div>
      )}

      {/* 4 Metric Cards (Handout §8.2 / Page 6) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Card 1: Open Tickets */}
        <div
          onClick={() => onNavigate && onNavigate('my-tickets', { status: 'OPEN_ACTIVE', label: 'Open Tickets (Active)' })}
          className="tkt-metric-card tkt-metric-card-assigned"
        >
          <div>
            <div className="tkt-card-header">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Open Tickets
              </span>
              <div className="tkt-card-icon-badge tkt-card-icon-green">
                <svg width="20" height="20" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
            <div className="tkt-metric-val text-emerald-800">
              {metrics.openTicketsCount}
            </div>
          </div>
          <div className="tkt-metric-sub">
            <span>In progress or queued</span>
            <span className="text-emerald-700 font-semibold">View all &rarr;</span>
          </div>
        </div>

        {/* Card 2: Waiting for Feedback */}
        <div
          onClick={() => onNavigate && onNavigate('my-tickets', { status: 'WAITING_FOR_REQUESTER', label: 'Waiting for My Feedback' })}
          className="tkt-metric-card tkt-metric-card-unassigned"
        >
          <div>
            <div className="tkt-card-header">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Waiting for My Feedback
              </span>
              <div className="tkt-card-icon-badge tkt-card-icon-amber">
                <svg width="20" height="20" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
            </div>
            <div className="tkt-metric-val text-amber-600">
              {metrics.waitingForRequesterCount}
            </div>
          </div>
          <div className="tkt-metric-sub">
            <span>Needs your reply</span>
            <span className="text-amber-700 font-semibold">View all &rarr;</span>
          </div>
        </div>

        {/* Card 3: Recently Resolved */}
        <div
          onClick={() => onNavigate && onNavigate('my-tickets')}
          className="tkt-metric-card"
          style={{ borderLeft: '4px solid #10b981' }}
        >
          <div>
            <div className="tkt-card-header">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Recently Resolved
              </span>
              <div className="tkt-card-icon-badge" style={{ background: '#d1fae5', color: '#065f46' }}>
                <svg width="20" height="20" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <div className="tkt-metric-val text-emerald-700">
              {metrics.recentlyResolvedCount}
            </div>
          </div>
          <div className="tkt-metric-sub">
            <span>Ready for confirmation</span>
            <span className="text-emerald-700 font-semibold">View all &rarr;</span>
          </div>
        </div>

        {/* Card 4: Closed Tickets */}
        <div
          onClick={() => onNavigate && onNavigate('my-tickets')}
          className="tkt-metric-card"
          style={{ borderLeft: '4px solid #64748b' }}
        >
          <div>
            <div className="tkt-card-header">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Closed Tickets
              </span>
              <div className="tkt-card-icon-badge" style={{ background: '#f1f5f9', color: '#475569' }}>
                <svg width="20" height="20" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              </div>
            </div>
            <div className="tkt-metric-val text-slate-600">
              {metrics.closedTicketsCount}
            </div>
          </div>
          <div className="tkt-metric-sub">
            <span>Completed requests</span>
            <span className="text-slate-600 font-semibold">View all &rarr;</span>
          </div>
        </div>
      </div>

      {/* 2-Column Split: Recent Tickets (65%) and Quick Actions (35%) - Handout §8.2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: My Recent Tickets */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                My Recent Tickets
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Recently updated tickets under your account
              </p>
            </div>
            {recentTickets.length > 0 && (
              <button
                onClick={() => onNavigate && onNavigate('my-tickets')}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 group"
              >
                <span>View all</span>
                <span className="group-hover:translate-x-0.5 transition-transform">&rarr;</span>
              </button>
            )}
          </div>

          {isZeroTicket || recentTickets.length === 0 ? (
            <div className="p-12 text-center bg-slate-50/70 rounded-xl border border-dashed border-slate-200">
              <div style={{ width: '48px', height: '48px', margin: '0 auto 12px', borderRadius: '50%', backgroundColor: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="24" height="24" fill="none" stroke="#065f46" viewBox="0 0 24 24" style={{ width: '24px', height: '24px' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-slate-800">
                No tickets submitted yet
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Need technical support or assistance? Submit a ticket and our IT Staff will help you right away.
              </p>
              <button
                onClick={() => onNavigate && onNavigate('create-ticket')}
                className="tkt-btn-action-primary mt-4 inline-flex items-center gap-2"
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '16px', height: '16px' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Create Your First Ticket
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentTickets.map((t) => (
                <div
                  key={t.id}
                  onClick={() => onNavigate && onNavigate('ticket-detail', t.id)}
                  className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/40 hover:bg-emerald-50/40 hover:border-emerald-200 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {t.ticketNumber}
                      </span>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${getStatusBadgeClass(t.currentStatus)}`}>
                        {formatStatus(t.currentStatus)}
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-slate-900 group-hover:text-emerald-900 transition">
                      {t.summary}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <span className="text-xs text-slate-500 font-medium">
                      Updated {new Date(t.updatedAt).toLocaleDateString('en-GB', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <span className="text-slate-400 group-hover:text-emerald-700 transition">
                      &rarr;
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Quick Actions (Handout §8.2 / Page 6) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-100">
            Quick Actions
          </h2>
          <div className="space-y-3">
            <button
              onClick={() => onNavigate && onNavigate('create-ticket')}
              className="tkt-quick-action-btn"
            >
              <span className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-lg">
                +
              </span>
              <div>
                <div className="text-sm font-bold text-slate-900">Create Ticket</div>
                <div className="text-xs text-slate-500 font-normal">Submit a new request</div>
              </div>
            </button>

            <button
              onClick={() => onNavigate && onNavigate('my-tickets')}
              className="tkt-quick-action-btn"
            >
              <span className="w-9 h-9 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center text-sm">
                <svg width="16" height="16" className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </span>
              <div>
                <div className="text-sm font-bold text-slate-900">View My Tickets</div>
                <div className="text-xs text-slate-500 font-normal">Track existing requests</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
