import React, { useState, useEffect } from 'react';
import type { Ticket, Pagination, Category, User } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface StaffTicketQueueProps {
  onSelectTicket: (ticketId: number) => void;
}

export const StaffTicketQueue: React.FC<StaffTicketQueueProps> = ({ onSelectTicket }) => {
  const { token } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pageSize: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Sorting
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [ownerFilter, setOwnerFilter] = useState('');
  const [sortOrder, setSortOrder] = useState('updatedAt_desc');
  const [page, setPage] = useState(1);

  // Reference data
  const [categories, setCategories] = useState<Category[]>([]);
  const [staffUsers, setStaffUsers] = useState<User[]>([]);

  useEffect(() => {
    fetchReferenceData();
  }, []);

  useEffect(() => {
    fetchQueue();
  }, [page, statusFilter, priorityFilter, categoryFilter, ownerFilter, sortOrder]);

  const fetchReferenceData = async () => {
    try {
      const catRes = await fetch('/api/categories');
      if (catRes.ok) {
        const catData = await catRes.json();
        setCategories(Array.isArray(catData) ? catData : catData.categories || []);
      }

      const usersRes = await fetch('/api/admin/users?role=STAFF', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (usersRes.ok) {
        const userData = await usersRes.json();
        setStaffUsers(userData.users || []);
      }
    } catch {}
  };

  const fetchQueue = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      if (priorityFilter) params.append('priority', priorityFilter);
      if (categoryFilter) params.append('categoryId', categoryFilter);
      if (ownerFilter) params.append('ownerId', ownerFilter);
      if (sortOrder) params.append('sort', sortOrder);
      params.append('page', String(page));
      params.append('pageSize', '10');

      const res = await fetch(`/api/staff/tickets?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error('Failed to fetch ticket queue.');
      }

      const data = await res.json();
      setTickets(data.tickets || []);
      setPagination(data.pagination || { page: 1, pageSize: 10, total: 0, totalPages: 1 });
    } catch (err: any) {
      setError(err.message || 'An error occurred while loading tickets.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchQueue();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'NEW':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">New</span>;
      case 'OPEN':
      case 'IN_PROGRESS':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">In Progress</span>;
      case 'WAITING_FOR_REQUESTER':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">Waiting</span>;
      case 'RESOLVED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">Resolved</span>;
      case 'CLOSED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">Closed</span>;
      case 'CANCELLED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">Cancelled</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  const getPriorityBadge = (priority?: string | null) => {
    switch (priority) {
      case 'URGENT':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">Urgent</span>;
      case 'HIGH':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">High</span>;
      case 'MEDIUM':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-800">Medium</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">Low</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Title */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">IT Staff Shared Ticket Queue</h2>
        <p className="text-sm text-slate-600">Find, assign, prioritize, and process support tickets across all requesters.</p>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ticket number, summary, or description..."
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            />
            <span className="absolute left-3 top-2.5 text-slate-400">🔍</span>
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-[#005a36] hover:bg-[#008751] text-white font-medium rounded-lg text-sm transition-colors"
          >
            Search
          </button>
        </form>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-600"
            >
              <option value="">All Statuses</option>
              <option value="NEW">New</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="WAITING_FOR_REQUESTER">Waiting for Requester</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Priority</label>
            <select
              value={priorityFilter}
              onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}
              className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-600"
            >
              <option value="">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
              className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-600"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Owner</label>
            <select
              value={ownerFilter}
              onChange={(e) => { setOwnerFilter(e.target.value); setPage(1); }}
              className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-600"
            >
              <option value="">All Owners</option>
              <option value="unassigned">Unassigned</option>
              {staffUsers.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Sort By</label>
            <select
              value={sortOrder}
              onChange={(e) => { setSortOrder(e.target.value); setPage(1); }}
              className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-600"
            >
              <option value="updatedAt_desc">Last Updated (Newest)</option>
              <option value="createdAt_desc">Created Date (Newest)</option>
              <option value="createdAt_asc">Created Date (Oldest)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content Area */}
      {error && (
        <div role="alert" className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm mb-6">
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white p-12 text-center rounded-xl shadow-sm border border-slate-200">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-emerald-600 border-t-transparent"></div>
          <p className="mt-3 text-sm text-slate-500">Loading ticket queue...</p>
        </div>
      ) : tickets.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-xl shadow-sm border border-slate-200">
          <span className="text-4xl">📭</span>
          <h3 className="mt-2 font-bold text-slate-900">No Tickets Found</h3>
          <p className="text-sm text-slate-500 mt-1">Try resetting your filters or search terms.</p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 font-semibold text-slate-700">
                <tr>
                  <th className="px-4 py-3">Ticket No</th>
                  <th className="px-4 py-3">Summary</th>
                  <th className="px-4 py-3">Requester</th>
                  <th className="px-4 py-3">Req. Priority</th>
                  <th className="px-4 py-3">IT Priority</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Owner</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {tickets.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-mono font-medium text-emerald-800">{t.ticketNumber}</td>
                    <td className="px-4 py-3 max-w-xs truncate font-medium text-slate-900">{t.summary}</td>
                    <td className="px-4 py-3 text-slate-600">{t.requester.name}</td>
                    <td className="px-4 py-3">{getPriorityBadge(t.requestedPriority)}</td>
                    <td className="px-4 py-3">{getPriorityBadge(t.itPriority || t.requestedPriority)}</td>
                    <td className="px-4 py-3">{getStatusBadge(t.currentStatus)}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {t.owner ? t.owner.name : <span className="italic text-slate-400">Unassigned</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => onSelectTicket(t.id)}
                        className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold text-xs rounded-md border border-emerald-200 transition-colors"
                      >
                        Open Detail
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {tickets.map((t) => (
              <div key={t.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-mono font-bold text-emerald-800 text-sm">{t.ticketNumber}</span>
                  {getStatusBadge(t.currentStatus)}
                </div>
                <h4 className="font-bold text-slate-900 text-base">{t.summary}</h4>
                <div className="text-xs text-slate-500 space-y-1">
                  <p>Requester: <span className="text-slate-800 font-medium">{t.requester.name}</span></p>
                  <p>IT Priority: {getPriorityBadge(t.itPriority || t.requestedPriority)}</p>
                  <p>Owner: <span className="text-slate-800 font-medium">{t.owner ? t.owner.name : 'Unassigned'}</span></p>
                </div>
                <button
                  onClick={() => onSelectTicket(t.id)}
                  className="w-full mt-2 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold text-xs rounded-lg border border-emerald-200 text-center"
                >
                  Open Ticket Detail
                </button>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between mt-6 bg-white px-4 py-3 rounded-xl border border-slate-200 shadow-sm text-xs">
            <span className="text-slate-600">
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} total tickets)
            </span>
            <div className="flex space-x-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={page >= pagination.totalPages}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
