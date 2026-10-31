import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

interface StaffDashboardMetrics {
  unassignedCount: number;
  myAssignedCount: number;
  openTotalCount: number;
  urgentCount: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
}

interface StaffRecentAction {
  id: number;
  ticketId: number;
  ticketNumber: string;
  actionDateTime: string;
  description: string;
  result?: string | null;
  followUpRequired?: boolean;
}

interface UrgentTicket {
  id: number;
  ticketNumber: string;
  summary: string;
  currentStatus: string;
  itPriority: string;
  ownerName?: string | null;
  createdAt: string;
}

interface AdminMetrics {
  totalUsers: number;
  requestersCount: number;
  staffCount: number;
  adminsCount: number;
}

interface StaffDashboardData {
  metrics: StaffDashboardMetrics;
  myRecentActions: StaffRecentAction[];
  urgentTickets: UrgentTicket[];
  adminMetrics?: AdminMetrics | null;
}

interface StaffDashboardProps {
  onNavigate?: (tab: string, ticketIdOrFilter?: any) => void;
}

export const StaffDashboard: React.FC<StaffDashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [data, setData] = useState<StaffDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [errorStatus, setErrorStatus] = useState<number | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    setErrorStatus(null);
    try {
      const token = localStorage.getItem('toktickit_token') || localStorage.getItem('token');
      const res = await fetch('/api/dashboard/staff', {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {
        setErrorStatus(res.status);
        if (res.status === 403) {
          throw new Error('403 Forbidden: Access restricted to authorized IT Staff and Administrators.');
        } else if (res.status >= 500) {
          throw new Error('500 Internal Server Error: Failed to compute operational queue telemetry.');
        } else {
          throw new Error(`Error ${res.status}: Failed to load staff dashboard data.`);
        }
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
    fetchDashboardData();
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
            <div key={i} className="h-28 bg-slate-100 border border-slate-200 rounded-xl p-4 flex flex-col justify-between animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-24"></div>
              <div className="h-8 bg-slate-300 rounded w-16"></div>
            </div>
          ))}
        </div>
        <div className="h-48 bg-slate-100 border border-slate-200 rounded-xl p-6 animate-pulse mb-8 flex flex-col justify-around">
          <div className="h-5 bg-slate-200 rounded w-48"></div>
          <div className="h-4 bg-slate-200 rounded w-full"></div>
          <div className="h-4 bg-slate-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    if (errorStatus === 403 || error?.includes('403')) {
      return (
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-amber-50 border-2 border-amber-500 text-amber-900 p-6 rounded-2xl shadow-sm max-w-2xl mx-auto text-center">
            <div style={{ width: '48px', height: '48px', margin: '0 auto 12px', borderRadius: '50%', backgroundColor: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="24" height="24" fill="none" stroke="#92400e" viewBox="0 0 24 24" style={{ width: '24px', height: '24px' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-amber-900 mb-2">403 Forbidden: Access Restricted</h2>
            <p className="text-sm text-amber-800 mb-6">
              You do not have permission to view the IT Staff Dashboard. This operational triage interface is strictly restricted to authenticated IT Staff and Administrators.
            </p>
            <button
              onClick={() => onNavigate && onNavigate('requester-dashboard')}
              className="tkt-btn-primary"
            >
              &larr; Return to My Support Dashboard
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 flex justify-between items-center">
          <div>
            <strong>Error: </strong> {error || 'Unable to load dashboard data.'}
          </div>
          <button
            onClick={fetchDashboardData}
            className="text-sm font-semibold underline hover:text-red-800"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const formatStatus = (st: string) => {
    return st
      .split('_')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  };

  const getProgressBarColor = (status: string) => {
    switch (status) {
      case 'NEW': return '#3b82f6';
      case 'OPEN': return '#0284c7';
      case 'IN_PROGRESS': return '#006B3C';
      case 'WAITING_FOR_REQUESTER': return '#d97706';
      case 'RESOLVED': return '#059669';
      case 'CLOSED': return '#64748b';
      case 'CANCELLED': return '#94a3b8';
      default: return '#006B3C';
    }
  };

  const getInitials = (name?: string | null) => {
    if (!name) return 'IT';
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  };

  const { metrics, myRecentActions, urgentTickets, adminMetrics } = data;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Modern Dashboard Hero Header */}
      <div className="tkt-dash-hero">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-100/70 text-emerald-800 text-xs font-semibold mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
            Operational Service Desk
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Staff Dashboard
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Welcome back, <span className="font-semibold text-slate-900">{user?.name}</span>. Here is your operational telemetry and queue status.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchDashboardData}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition shadow-sm"
            title="Refresh dashboard metrics"
          >
            <svg width="14" height="14" className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh Metrics
          </button>
          <button
            onClick={() => onNavigate && onNavigate('staff-queue')}
            className="tkt-btn-action-primary inline-flex items-center gap-2"
          >
            <svg width="16" height="16" className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Ticket Queue
          </button>
        </div>
      </div>

      {/* Primary 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Card 1: Unassigned */}
        <div
          onClick={() => onNavigate && onNavigate('staff-queue', { filter: 'unassigned' })}
          className="tkt-metric-card tkt-metric-card-unassigned"
        >
          <div>
            <div className="tkt-card-header">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Unassigned
              </span>
              <div className="tkt-card-icon-badge tkt-card-icon-amber">
                <svg width="20" height="20" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
            </div>
            <div className="tkt-metric-val">
              {metrics.unassignedCount}
            </div>
          </div>
          <div className="tkt-metric-sub">
            <span>Needs triage &amp; claim</span>
            <span className="text-amber-700 font-semibold group-hover:underline">View queue &rarr;</span>
          </div>
        </div>

        {/* Card 2: My Assigned */}
        <div
          onClick={() => onNavigate && onNavigate('staff-queue', { filter: 'mine' })}
          className="tkt-metric-card tkt-metric-card-assigned"
        >
          <div>
            <div className="tkt-card-header">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                My Assigned
              </span>
              <div className="tkt-card-icon-badge tkt-card-icon-green">
                <svg width="20" height="20" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>
            <div className="tkt-metric-val text-emerald-800">
              {metrics.myAssignedCount}
            </div>
          </div>
          <div className="tkt-metric-sub">
            <span>Active work owned by you</span>
            <span className="text-emerald-700 font-semibold">View work &rarr;</span>
          </div>
        </div>

        {/* Card 3: High & Urgent */}
        <div
          onClick={() => onNavigate && onNavigate('staff-queue', { filter: 'urgent' })}
          className="tkt-metric-card tkt-metric-card-urgent"
        >
          <div>
            <div className="tkt-card-header">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                High &amp; Urgent
              </span>
              <div className="tkt-card-icon-badge tkt-card-icon-red">
                <svg width="20" height="20" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
            <div className="tkt-metric-val text-red-600">
              {metrics.urgentCount}
            </div>
          </div>
          <div className="tkt-metric-sub">
            <span>Critical priority queue</span>
            <span className="text-red-700 font-semibold">View urgent &rarr;</span>
          </div>
        </div>

        {/* Card 4: Open Total */}
        <div
          onClick={() => onNavigate && onNavigate('staff-queue')}
          className="tkt-metric-card tkt-metric-card-total"
        >
          <div>
            <div className="tkt-card-header">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Open Total
              </span>
              <div className="tkt-card-icon-badge tkt-card-icon-blue">
                <svg width="20" height="20" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
            </div>
            <div className="tkt-metric-val text-blue-900">
              {metrics.openTotalCount}
            </div>
          </div>
          <div className="tkt-metric-sub">
            <span>All active tickets across system</span>
            <span className="text-blue-700 font-semibold">View all &rarr;</span>
          </div>
        </div>
      </div>

      {/* Main Content 2-Column Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols wide on desktop) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Urgent Tickets Attention Queue */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></div>
                <h2 className="text-base font-bold text-slate-900">
                  Urgent Attention Queue
                </h2>
              </div>
              <span className="text-xs bg-red-50 text-red-700 font-semibold px-2.5 py-1 rounded-full border border-red-200">
                {urgentTickets.length} Tickets
              </span>
            </div>

            {urgentTickets.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm bg-slate-50/70 rounded-xl border border-dashed border-slate-200">
                No urgent tickets requiring immediate triage.
              </div>
            ) : (
              <div className="space-y-3">
                {urgentTickets.map((t) => (
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
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">
                          URGENT
                        </span>
                      </div>
                      <div className="text-sm font-semibold text-slate-900 group-hover:text-emerald-900 transition">
                        {t.summary}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 self-end sm:self-center">
                      <div className="text-xs text-slate-500 flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-md border border-slate-200">
                        <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 font-bold text-[10px] flex items-center justify-center">
                          {getInitials(t.ownerName)}
                        </span>
                        <span className="font-medium text-slate-700 max-w-[120px] truncate">
                          {t.ownerName || 'Unassigned'}
                        </span>
                      </div>
                      <span className="text-slate-400 group-hover:text-emerald-700 transition">
                        &rarr;
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Ticket Breakdown by Status */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="mb-4 pb-3 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Status Distribution
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Operational distribution across all active lifecycle stages
                </p>
              </div>
              <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                Total: {metrics.openTotalCount}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(metrics.byStatus || {}).map(([st, cnt]) => {
                const total = metrics.openTotalCount || 15;
                const pct = Math.min(100, Math.round((cnt / total) * 100));
                const barColor = getProgressBarColor(st);
                return (
                  <div
                    key={st}
                    onClick={() => onNavigate && onNavigate('staff-queue', { status: st })}
                    className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-slate-300 hover:shadow-xs transition-all cursor-pointer group"
                  >
                    <div className="flex justify-between items-center text-xs font-semibold text-slate-700 mb-1.5 group-hover:text-emerald-800">
                      <span>{formatStatus(st)}</span>
                      <span className="text-slate-500 font-mono text-[11px] bg-white px-1.5 py-0.5 rounded border border-slate-200">
                        {cnt} ({pct}%)
                      </span>
                    </div>
                    <div className="tkt-progress-track">
                      <div
                        className="tkt-progress-fill"
                        style={{ width: `${pct}%`, backgroundColor: barColor }}
                        title={`${st}: ${cnt} tickets (${pct}%)`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Priority Breakdown Bar */}
            {metrics.byPriority && (
              <div className="mt-5 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Priority Breakdown (Active Queue)
                  </h3>
                  <span className="text-[11px] text-slate-500">By IT Priority</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {(['URGENT', 'HIGH', 'MEDIUM', 'LOW'] as const).map((prio) => {
                    const pCount = metrics.byPriority?.[prio] ?? 0;
                    const badgeStyle =
                      prio === 'URGENT'
                        ? { bg: '#fef2f2', border: '#fecaca', text: '#b91c1c' }
                        : prio === 'HIGH'
                        ? { bg: '#fff7ed', border: '#fed7aa', text: '#c2410c' }
                        : prio === 'MEDIUM'
                        ? { bg: '#fffbeb', border: '#fde68a', text: '#b45309' }
                        : { bg: '#f0fdf4', border: '#bbf7d0', text: '#15803d' };
                    return (
                      <div
                        key={prio}
                        onClick={() => onNavigate && onNavigate('staff-queue', { priority: prio })}
                        style={{
                          backgroundColor: badgeStyle.bg,
                          border: `1px solid ${badgeStyle.border}`,
                          color: badgeStyle.text,
                        }}
                        className="p-2.5 rounded-xl flex items-center justify-between cursor-pointer transition hover:shadow-sm"
                      >
                        <span className="text-xs font-bold">{prio}</span>
                        <span className="text-sm font-extrabold font-mono">{pCount}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1 Col wide on desktop) */}
        <div className="space-y-6">
          {/* Quick Actions Panel (Handout §8.1) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 mb-3 pb-2 border-b border-slate-100">
              Quick Actions
            </h2>
            <div className="space-y-2.5">
              <button
                onClick={() => onNavigate && onNavigate('create-ticket')}
                className="tkt-quick-action-btn"
              >
                <span className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-base">
                  +
                </span>
                <div>
                  <div className="text-sm font-bold text-slate-900">Create Ticket</div>
                  <div className="text-xs text-slate-500 font-normal">Submit a new IT support request</div>
                </div>
              </button>

              <button
                onClick={() => onNavigate && onNavigate('staff-queue')}
                className="tkt-quick-action-btn"
              >
                <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center text-sm">
                  <svg width="16" height="16" className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                <div>
                  <div className="text-sm font-bold text-slate-900">Search Tickets</div>
                  <div className="text-xs text-slate-500 font-normal">Filter queue by status or category</div>
                </div>
              </button>

              <button
                onClick={() => onNavigate && onNavigate('staff-queue', { filter: 'mine' })}
                className="tkt-quick-action-btn"
              >
                <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center text-sm">
                  <svg width="16" height="16" className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                <div>
                  <div className="text-sm font-bold text-slate-900">My Claimed Queue</div>
                  <div className="text-xs text-slate-500 font-normal">{metrics.myAssignedCount} tickets owned by you</div>
                </div>
              </button>
            </div>
          </div>

          {/* My Recent Actions Taken */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">
                My Recent Actions
              </h2>
              <span className="text-xs text-slate-500 font-semibold">
                {myRecentActions.length} Actions
              </span>
            </div>

            {myRecentActions.length === 0 ? (
              <div className="py-8 px-4 text-center bg-emerald-50/40 border border-emerald-100 rounded-xl">
                <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <svg width="20" height="20" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-slate-800 mb-1">No Recent Actions Recorded</h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto mb-3">
                  You haven't logged any troubleshooting actions on active tickets yet.
                </p>
                <button
                  onClick={() => onNavigate && onNavigate('staff-queue', { filter: 'unassigned' })}
                  className="tkt-btn-secondary text-xs"
                >
                  View Unassigned Queue &rarr;
                </button>
              </div>
            ) : (
              <div className="space-y-1">
                {myRecentActions.map((action) => (
                  <div
                    key={action.id}
                    onClick={() => onNavigate && onNavigate('ticket-detail', action.ticketId)}
                    className="tkt-action-stream-item group"
                  >
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                      <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                        {action.ticketNumber}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(action.actionDateTime).toLocaleDateString('en-GB', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <div className="text-xs font-medium text-slate-800 group-hover:text-emerald-900 transition line-clamp-2">
                      {action.description}
                    </div>
                    {action.result && (
                      <div className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        <span className="font-semibold text-emerald-900">Result:</span> {action.result}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Admin Panel (if admin) */}
          {adminMetrics && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h2 className="text-base font-bold text-slate-900 mb-3 pb-2 border-b border-slate-100">
                Admin User Metrics
              </h2>
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-xs text-slate-500 font-semibold">Total Users</div>
                  <div className="text-xl font-extrabold text-slate-900 mt-0.5">{adminMetrics.totalUsers}</div>
                </div>
                <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
                  <div className="text-xs text-emerald-700 font-semibold">Staff</div>
                  <div className="text-xl font-extrabold text-emerald-800 mt-0.5">{adminMetrics.staffCount}</div>
                </div>
                <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100">
                  <div className="text-xs text-blue-700 font-semibold">Requesters</div>
                  <div className="text-xl font-extrabold text-blue-800 mt-0.5">{adminMetrics.requestersCount}</div>
                </div>
                <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-100">
                  <div className="text-xs text-purple-700 font-semibold">Admins</div>
                  <div className="text-xl font-extrabold text-purple-800 mt-0.5">{adminMetrics.adminsCount}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
