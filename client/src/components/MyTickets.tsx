import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import type { Ticket, Category, RelatedSystem } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

interface MyTicketsProps {
  onSelectTicket: (ticketId: number) => void;
  onCreateNewTicket: () => void;
}

export const MyTickets: React.FC<MyTicketsProps> = ({ onSelectTicket, onCreateNewTicket }) => {
  const { token } = useAuth();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [relatedSystems, setRelatedSystems] = useState<RelatedSystem[]>([]);

  // Filter & Search State
  const [search, setSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSystem, setSelectedSystem] = useState<string>('');
  const [selectedPriority, setSelectedPriority] = useState<string>('');
  const [sort, setSort] = useState<string>('updatedAt_desc');

  // Pagination State
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalTickets, setTotalTickets] = useState<number>(0);

  // UI State
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReferences = async () => {
      try {
        const [catRes, sysRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/categories`),
          fetch(`${API_BASE_URL}/api/related-systems`),
        ]);

        if (catRes.ok) {
          const catData = await catRes.json();
          setCategories(Array.isArray(catData) ? catData : catData.categories || []);
        }

        if (sysRes.ok) {
          const sysData = await sysRes.json();
          setRelatedSystems(sysData.relatedSystems || []);
        }
      } catch (err) {}
    };

    fetchReferences();
  }, []);

  const fetchTickets = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (selectedCategory) params.append('categoryId', selectedCategory);
      if (selectedSystem) params.append('relatedSystemId', selectedSystem);
      if (selectedPriority) params.append('priority', selectedPriority);
      if (sort) params.append('sort', sort);
      params.append('page', String(page));
      params.append('pageSize', '10');

      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL}/api/tickets?${params.toString()}`, { headers });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || `HTTP ${res.status}: Failed to fetch tickets.`);
      }

      setTickets(data.tickets || []);
      if (data.pagination) {
        setTotalPages(data.pagination.totalPages || 1);
        setTotalTickets(data.pagination.total || 0);
      }
    } catch (err: any) {
      setError(err.message || 'Unable to connect to server. Please try again.');
      setTickets([]);
    } finally {
      setIsLoading(false);
    }
  }, [search, selectedCategory, selectedSystem, selectedPriority, sort, page, token]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchTickets();
  };

  const getPriorityBadge = (priority: string) => {
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
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">My IT Support Tickets</h2>
          <p className="text-sm text-slate-600">Track and manage support requests submitted under your account.</p>
        </div>
        <button
          onClick={onCreateNewTicket}
          className="px-4 py-2.5 bg-[#005a36] hover:bg-[#008751] text-white font-semibold text-sm rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2"
        >
          <span>➕</span> Create New Ticket
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ticket number, summary..."
            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none"
          />
          <button type="submit" className="px-4 py-2 bg-[#005a36] text-white font-medium text-sm rounded-lg hover:bg-[#008751]">
            Search
          </button>
        </form>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100 text-xs">
          <div>
            <label className="block font-medium text-slate-500 mb-1">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => { setSelectedCategory(e.target.value); setPage(1); }}
              className="w-full p-2 border border-slate-300 rounded-lg"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-medium text-slate-500 mb-1">Related System</label>
            <select
              value={selectedSystem}
              onChange={(e) => { setSelectedSystem(e.target.value); setPage(1); }}
              className="w-full p-2 border border-slate-300 rounded-lg"
            >
              <option value="">All Systems</option>
              {relatedSystems.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-medium text-slate-500 mb-1">Priority</label>
            <select
              value={selectedPriority}
              onChange={(e) => { setSelectedPriority(e.target.value); setPage(1); }}
              className="w-full p-2 border border-slate-300 rounded-lg"
            >
              <option value="">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>

          <div>
            <label className="block font-medium text-slate-500 mb-1">Sort</label>
            <select
              value={sort}
              onChange={(e) => { setSort(e.target.value); setPage(1); }}
              className="w-full p-2 border border-slate-300 rounded-lg"
            >
              <option value="updatedAt_desc">Last Updated (Newest)</option>
              <option value="createdAt_desc">Created Date (Newest)</option>
              <option value="createdAt_asc">Created Date (Oldest)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tickets List */}
      {error && <div role="alert" className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm">{error}</div>}

      {isLoading ? (
        <div className="bg-white p-12 text-center rounded-xl shadow-sm border border-slate-200">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-emerald-600 border-t-transparent"></div>
          <p className="mt-3 text-sm text-slate-500">Loading your tickets...</p>
        </div>
      ) : tickets.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-xl shadow-sm border border-slate-200 space-y-3">
          <span className="text-4xl">🎫</span>
          <h3 className="font-bold text-slate-900 text-base">No Tickets Found</h3>
          <p className="text-sm text-slate-500">You have not submitted any tickets matching your search/filter criteria.</p>
          <button
            onClick={onCreateNewTicket}
            className="px-4 py-2 bg-[#005a36] text-white font-semibold text-xs rounded-lg shadow-sm"
          >
            Create Your First Ticket
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="divide-y divide-slate-200">
            {tickets.map((t) => (
              <div key={t.id} className="p-4 sm:p-5 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-emerald-800 text-xs bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {t.ticketNumber}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                      {t.currentStatus}
                    </span>
                    {getPriorityBadge(t.requestedPriority)}
                  </div>
                  <h3 className="font-bold text-slate-900 text-base">{t.summary}</h3>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span>Category: <strong className="text-slate-700">{t.category.name}</strong></span>
                    <span>System: <strong className="text-slate-700">{t.relatedSystem.name}</strong></span>
                    <span>Created: {new Date(t.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <button
                  onClick={() => onSelectTicket(t.id)}
                  className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-[#005a36] font-semibold text-xs rounded-lg border border-emerald-300 transition-colors"
                >
                  View Details →
                </button>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-t border-slate-200 text-xs">
            <span className="text-slate-600">Page {page} of {totalPages} ({totalTickets} tickets)</span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1.5 border border-slate-300 rounded text-slate-700 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1.5 border border-slate-300 rounded text-slate-700 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
