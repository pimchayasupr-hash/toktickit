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

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('toktickit_token') || localStorage.getItem('token');
      const res = await fetch('/api/dashboard/staff', {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {
        throw new Error('Failed to load staff dashboard data.');
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
            onClick={fetchDashboardData}
            className="text-sm font-semibold underline hover:text-red-800"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { metrics, myRecentActions, urgentTickets, adminMetrics } = data;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Staff Dashboard
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Welcome back, <span className="font-semibold">{user?.name}</span>. Here is your operational overview.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchDashboardData}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition shadow-sm"
            title="Refresh dashboard metrics"
          >
            🔄 Refresh Metrics
          </button>
          <button
            onClick={() => onNavigate && onNavigate('staff-queue')}
            className="tkt-btn-action-primary"
          >
            📋 Ticket Queue
          </button>
        </div>
      </div>

      {/* Primary 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Card 1: Unassigned */}
        <div
          onClick={() => onNavigate && onNavigate('staff-queue', { filter: 'unassigned' })}
          className="bg-white border border-emerald-100 rounded-xl p-5 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col justify-between"
          style={{ borderTop: '4px solid #006B3C' }}
        >
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Unassigned
            </div>
            <div className="text-3xl font-extrabold text-slate-900">
              {metrics.unassignedCount}
            </div>
          </div>
          <div className="text-xs text-slate-500 mt-3 flex items-center justify-between">
            <span>Needs triage & claim</span>
            <span className="text-emerald-700 font-semibold">View &rarr;</span>
          </div>
        </div>

        {/* Card 2: My Assigned */}
        <div
          onClick={() => onNavigate && onNavigate('staff-queue', { filter: 'mine' })}
          className="bg-white border border-emerald-100 rounded-xl p-5 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col justify-between"
          style={{ borderTop: '4px solid #008751' }}
        >
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              My Assigned
            </div>
            <div className="text-3xl font-extrabold text-slate-900">
              {metrics.myAssignedCount}
            </div>
          </div>
          <div className="text-xs text-slate-500 mt-3 flex items-center justify-between">
            <span>Active work owned by you</span>
            <span className="text-emerald-700 font-semibold">View &rarr;</span>
          </div>
        </div>

        {/* Card 3: High & Urgent */}
        <div
          onClick={() => onNavigate && onNavigate('staff-queue', { filter: 'urgent' })}
          className="bg-white border border-amber-100 rounded-xl p-5 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col justify-between"
          style={{ borderTop: '4px solid #dc2626' }}
        >
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              High &amp; Urgent
            </div>
            <div className="text-3xl font-extrabold text-red-600">
              {metrics.urgentCount}
            </div>
          </div>
          <div className="text-xs text-slate-500 mt-3 flex items-center justify-between">
            <span>Critical priority queue</span>
            <span className="text-red-700 font-semibold">View &rarr;</span>
          </div>
        </div>

        {/* Card 4: Open Total */}
        <div
          onClick={() => onNavigate && onNavigate('staff-queue')}
          className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col justify-between"
          style={{ borderTop: '4px solid #3b82f6' }}
        >
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Open Total
            </div>
            <div className="text-3xl font-extrabold text-slate-900">
              {metrics.openTotalCount}
            </div>
          </div>
          <div className="text-xs text-slate-500 mt-3 flex items-center justify-between">
            <span>All active tickets</span>
            <span className="text-blue-700 font-semibold">View &rarr;</span>
          </div>
        </div>
      </div>

      {/* Main Content 2-Column Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols wide on desktop) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Urgent Tickets Attention Queue */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <span>🔥</span> Urgent Attention Queue
              </h2>
              <span className="text-xs bg-red-100 text-red-800 font-semibold px-2.5 py-0.5 rounded-full">
                {urgentTickets.length} Tickets
              </span>
            </div>

            {urgentTickets.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-sm bg-slate-50 rounded-lg">
                No urgent tickets requiring immediate triage.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {urgentTickets.map((t) => (
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
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                          URGENT
                        </span>
                      </div>
                      <div className="text-sm font-medium text-slate-900 mt-1">
                        {t.summary}
                      </div>
                    </div>
                    <div className="text-xs text-slate-500 whitespace-nowrap">
                      Owner: <span className="font-medium text-slate-700">{t.ownerName || 'Unassigned'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Ticket Breakdown by Status */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-4">
              Status Distribution
            </h2>
            <div className="space-y-3">
              {Object.entries(metrics.byStatus || {}).map(([st, cnt]) => {
                const total = metrics.openTotalCount || 15;
                const pct = Math.min(100, Math.round((cnt / total) * 100));
                return (
                  <div
                    key={st}
                    onClick={() => onNavigate && onNavigate('staff-queue', { status: st })}
                    className="space-y-1 cursor-pointer group"
                  >
                    <div className="flex justify-between text-xs font-medium text-slate-700 group-hover:text-emerald-700">
                      <span>{st.replace(/_/g, ' ')}</span>
                      <span className="text-slate-500">{pct}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-emerald-600 h-2 rounded-full transition-all group-hover:bg-emerald-500"
                        style={{ width: `${pct}%` }}
                        title={`${st}: ${cnt} tickets`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column (1 Col wide on desktop) */}
        <div className="space-y-6">
          {/* My Recent Actions Taken */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span>🛠️</span> My Recent Actions
            </h2>

            {myRecentActions.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-sm bg-slate-50 rounded-lg">
                No recent actions recorded yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {myRecentActions.map((action) => (
                  <div
                    key={action.id}
                    onClick={() => onNavigate && onNavigate('ticket-detail', action.ticketId)}
                    className="py-3 hover:bg-slate-50 px-2 rounded-lg transition cursor-pointer"
                  >
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                      <span className="font-mono font-bold text-emerald-800">
                        {action.ticketNumber}
                      </span>
                      <span>
                        {new Date(action.actionDateTime).toLocaleDateString('th-TH', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <div className="text-sm font-medium text-slate-800">
                      {action.description}
                    </div>
                    {action.result && (
                      <div className="text-xs text-emerald-700 bg-emerald-50 px-2 py-1 rounded mt-1 border border-emerald-100">
                        <strong>Result:</strong> {action.result}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Admin Panel (if admin) */}
          {adminMetrics && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span>👥</span> Admin User Metrics
              </h2>
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="text-xs text-slate-500 font-semibold">Total Users</div>
                  <div className="text-xl font-bold text-slate-800 mt-1">{adminMetrics.totalUsers}</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="text-xs text-slate-500 font-semibold">Staff</div>
                  <div className="text-xl font-bold text-emerald-700 mt-1">{adminMetrics.staffCount}</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="text-xs text-slate-500 font-semibold">Requesters</div>
                  <div className="text-xl font-bold text-blue-700 mt-1">{adminMetrics.requestersCount}</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="text-xs text-slate-500 font-semibold">Admins</div>
                  <div className="text-xl font-bold text-purple-700 mt-1">{adminMetrics.adminsCount}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
