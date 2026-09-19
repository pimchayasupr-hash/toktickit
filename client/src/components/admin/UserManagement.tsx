import React, { useState, useEffect } from 'react';
import type { User, Role } from '../../types';
import { useAuth } from '../../context/AuthContext';

export const UserManagement: React.FC = () => {
  const { token } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [resettingUser, setResettingUser] = useState<User | null>(null);

  // Create Form State
  const [createName, setCreateName] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createRole, setCreateRole] = useState<Role>('REQUESTER');
  const [createIsActive, setCreateIsActive] = useState(true);
  const [createInitialPassword, setCreateInitialPassword] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSubmitting, setModalSubmitting] = useState(false);

  // Reset Password State
  const [newInitialPassword, setNewInitialPassword] = useState('');

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (roleFilter) params.append('role', roleFilter);

      const res = await fetch(`/api/admin/users?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Failed to fetch user list.');
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (!createName || !createEmail || !createInitialPassword) {
      setModalError('Please fill out all required fields.');
      return;
    }

    setModalSubmitting(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: createName,
          email: createEmail,
          role: createRole,
          isActive: createIsActive,
          initialPassword: createInitialPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to create user.');

      setShowCreateModal(false);
      resetCreateForm();
      fetchUsers();
    } catch (err: any) {
      setModalError(err.message);
    } finally {
      setModalSubmitting(false);
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setModalError(null);

    setModalSubmitting(true);
    try {
      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editingUser.name,
          email: editingUser.email,
          role: editingUser.role,
          isActive: editingUser.isActive,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to update user.');

      setEditingUser(null);
      fetchUsers();
    } catch (err: any) {
      setModalError(err.message);
    } finally {
      setModalSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resettingUser) return;
    setModalError(null);

    if (!newInitialPassword || newInitialPassword.length < 8) {
      setModalError('Initial password must be at least 8 characters long.');
      return;
    }

    setModalSubmitting(true);
    try {
      const res = await fetch(`/api/admin/users/${resettingUser.id}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ initialPassword: newInitialPassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to reset password.');

      setResettingUser(null);
      setNewInitialPassword('');
      fetchUsers();
    } catch (err: any) {
      setModalError(err.message);
    } finally {
      setModalSubmitting(false);
    }
  };

  const resetCreateForm = () => {
    setCreateName('');
    setCreateEmail('');
    setCreateRole('REQUESTER');
    setCreateIsActive(true);
    setCreateInitialPassword('');
    setModalError(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">User Management</h2>
          <p className="text-sm text-slate-600">Create, edit, activate/deactivate accounts, and assign system roles.</p>
        </div>
        <button
          onClick={() => { resetCreateForm(); setShowCreateModal(true); }}
          className="px-4 py-2.5 bg-[#005a36] hover:bg-[#008751] text-white font-semibold text-sm rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2"
        >
          <span>➕</span> Create New User
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users by name or email..."
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none"
          />
          <button type="submit" className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg text-sm">
            Search
          </button>
        </form>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="p-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-600"
        >
          <option value="">All Roles</option>
          <option value="REQUESTER">Requester</option>
          <option value="STAFF">IT Staff</option>
          <option value="ADMIN">Administrator</option>
        </select>
      </div>

      {/* Users Table */}
      {error && <div role="alert" className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm">{error}</div>}

      {loading ? (
        <div className="bg-white p-12 text-center rounded-xl shadow-sm border border-slate-200">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-emerald-600 border-t-transparent"></div>
          <p className="mt-3 text-sm text-slate-500">Loading user accounts...</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 font-semibold text-slate-700">
              <tr>
                <th className="px-4 py-3">Full Name</th>
                <th className="px-4 py-3">Email Address</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3 font-semibold text-slate-900">{u.name}</td>
                  <td className="px-4 py-3 text-slate-600">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                      u.role === 'ADMIN' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                      u.role === 'STAFF' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                      'bg-blue-100 text-blue-800 border-blue-200'
                    }`}>
                      {u.role === 'ADMIN' ? 'Administrator' : u.role === 'STAFF' ? 'IT Staff' : 'Requester'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {u.isActive ? (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">Active</span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">Inactive</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button
                      onClick={() => { setModalError(null); setEditingUser({ ...u }); }}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded border border-slate-300"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => { setModalError(null); setNewInitialPassword(''); setResettingUser(u); }}
                      className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 font-semibold text-xs rounded border border-amber-200"
                    >
                      Reset Password
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal: Create User */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Create New User Account</h3>
            {modalError && <div role="alert" className="mb-4 bg-red-50 text-red-700 p-3 rounded text-xs">{modalError}</div>}

            <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={createEmail}
                  onChange={(e) => setCreateEmail(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Role *</label>
                <select
                  value={createRole}
                  onChange={(e) => setCreateRole(e.target.value as Role)}
                  className="w-full p-2 border border-slate-300 rounded"
                >
                  <option value="REQUESTER">Requester</option>
                  <option value="STAFF">IT Staff</option>
                  <option value="ADMIN">Administrator</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Initial Password *</label>
                <input
                  type="password"
                  required
                  value={createInitialPassword}
                  onChange={(e) => setCreateInitialPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  className="w-full p-2 border border-slate-300 rounded"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">User will be prompted to change password on first login.</span>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="createIsActive"
                  checked={createIsActive}
                  onChange={(e) => setCreateIsActive(e.target.checked)}
                  className="rounded text-emerald-600"
                />
                <label htmlFor="createIsActive" className="font-semibold text-slate-700">Account Active</label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalSubmitting}
                  className="px-4 py-1.5 bg-[#005a36] text-white rounded font-semibold disabled:opacity-50"
                >
                  {modalSubmitting ? 'Saving...' : 'Save User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit User */}
      {editingUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Edit User Account</h3>
            {modalError && <div role="alert" className="mb-4 bg-red-50 text-red-700 p-3 rounded text-xs">{modalError}</div>}

            <form onSubmit={handleEditUser} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Role</label>
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as Role })}
                  className="w-full p-2 border border-slate-300 rounded"
                >
                  <option value="REQUESTER">Requester</option>
                  <option value="STAFF">IT Staff</option>
                  <option value="ADMIN">Administrator</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="editIsActive"
                  checked={editingUser.isActive}
                  onChange={(e) => setEditingUser({ ...editingUser, isActive: e.target.checked })}
                  className="rounded text-emerald-600"
                />
                <label htmlFor="editIsActive" className="font-semibold text-slate-700">Account Active</label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalSubmitting}
                  className="px-4 py-1.5 bg-[#005a36] text-white rounded font-semibold disabled:opacity-50"
                >
                  {modalSubmitting ? 'Updating...' : 'Update Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Reset Initial Password */}
      {resettingUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Reset Initial Password</h3>
            <p className="text-xs text-slate-500 mb-4">Set a new initial password for {resettingUser.name}. User will be forced to change it upon next login.</p>
            {modalError && <div role="alert" className="mb-4 bg-red-50 text-red-700 p-3 rounded text-xs">{modalError}</div>}

            <form onSubmit={handleResetPassword} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">New Initial Password *</label>
                <input
                  type="password"
                  required
                  value={newInitialPassword}
                  onChange={(e) => setNewInitialPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setResettingUser(null)}
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalSubmitting}
                  className="px-4 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded font-semibold disabled:opacity-50"
                >
                  {modalSubmitting ? 'Resetting...' : 'Set New Initial Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
