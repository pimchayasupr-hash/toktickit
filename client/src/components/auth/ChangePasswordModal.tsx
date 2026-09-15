import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export const ChangePasswordModal: React.FC = () => {
  const { changePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (newPassword.length < 8) {
      setErrorMessage('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('New password and confirmation password do not match.');
      return;
    }

    setSubmitting(true);
    const res = await changePassword(newPassword, currentPassword);
    setSubmitting(false);

    if (!res.success) {
      const err = (res as any).error || 'Failed to update password.';
      setErrorMessage(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md p-6">
        <div className="text-center mb-5">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-amber-100 text-amber-800 mb-3 font-bold text-xl">
            🔒
          </div>
          <h3 className="text-xl font-bold text-slate-900">Change Your Password</h3>
          <p className="text-xs text-amber-700 font-medium mt-1 bg-amber-50 p-2 rounded border border-amber-200">
            Notice: You must change your initial password before continuing into the application.
          </p>
        </div>

        {errorMessage && (
          <div role="alert" className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-lg text-sm">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Current (Temporary) Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              New Password
            </label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            />
          </div>

          <div className="bg-slate-50 p-3 rounded-lg text-xs text-slate-600 space-y-1 border border-slate-200">
            <p className="font-semibold text-slate-700 mb-1">Password Rules:</p>
            <p className={newPassword.length >= 8 ? 'text-emerald-700 font-medium' : ''}>
              ✓ Minimum 8 characters long
            </p>
            <p className={newPassword && newPassword === confirmPassword ? 'text-emerald-700 font-medium' : ''}>
              ✓ Confirm password matches
            </p>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 px-4 bg-[#005a36] hover:bg-[#008751] text-white font-semibold rounded-lg shadow text-sm transition-colors disabled:opacity-50"
          >
            {submitting ? 'Updating Password...' : 'Save New Password & Continue'}
          </button>
        </form>
      </div>
    </div>
  );
};
