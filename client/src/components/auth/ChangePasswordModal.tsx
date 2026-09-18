import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export const ChangePasswordModal: React.FC = () => {
  const { changePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const hasMinLength = newPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasDigit = /[0-9]/.test(newPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);
  const matchesConfirm = Boolean(newPassword && newPassword === confirmPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (newPassword.length < 8) {
      setErrorMessage('New password must be at least 8 characters long.');
      return;
    }

    if (!hasUpper || !hasLower || !hasDigit || !hasSpecial) {
      setErrorMessage('Password must include upper and lower case letters, a number, and a special character.');
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
    <div className="tkt-auth-page" style={{ position: 'fixed', inset: 0, zIndex: 50, backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)' }}>
      <div className="tkt-auth-card">
        {/* TikTockIT Header Bar */}
        <div className="tkt-auth-header-bar">
          <div className="tkt-brand-icon">⏱️</div>
          <div>
            <div className="tkt-brand-title">TikTockIT</div>
          </div>
        </div>

        <div className="tkt-auth-body">
          <h2 className="tkt-auth-title">Change Your Password</h2>
          <p className="tkt-auth-subtitle" style={{ color: '#b45309', backgroundColor: '#fffbeb', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #fde68a', fontSize: '0.8rem' }}>
            Notice: You must change your initial credentials before continuing.
          </p>

          {errorMessage && (
            <div role="alert" className="tkt-alert-error">
              <span>⚠️</span>
              <div>{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="tkt-form-group">
              <label className="tkt-label">Current (temporary) password</label>
              <div className="tkt-input-wrapper">
                <input
                  type={showCurrent ? 'text' : 'password'}
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="tkt-input"
                  style={{ paddingRight: '2.5rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="tkt-input-icon-btn"
                  tabIndex={-1}
                  title={showCurrent ? 'Hide' : 'Show'}
                  aria-label={showCurrent ? 'Hide' : 'Show'}
                >
                  {showCurrent ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="tkt-form-group">
              <label className="tkt-label">New password</label>
              <div className="tkt-input-wrapper">
                <input
                  type={showNew ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="tkt-input"
                  style={{ paddingRight: '2.5rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="tkt-input-icon-btn"
                  tabIndex={-1}
                  title={showNew ? 'Hide' : 'Show'}
                  aria-label={showNew ? 'Hide' : 'Show'}
                >
                  {showNew ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="tkt-form-group">
              <label className="tkt-label">Confirm new password</label>
              <div className="tkt-input-wrapper">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="tkt-input"
                  style={{ paddingRight: '2.5rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="tkt-input-icon-btn"
                  tabIndex={-1}
                  title={showConfirm ? 'Hide' : 'Show'}
                  aria-label={showConfirm ? 'Hide' : 'Show'}
                >
                  {showConfirm ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Password Rules Checklist Box */}
            <div className="tkt-rules-box">
              <div className="tkt-rules-heading">Password rules: (Minimum 8 characters long)</div>
              <div className="tkt-rule-item" style={{ color: hasMinLength ? '#15803d' : '#64748b' }}>
                <span>{hasMinLength ? '✓' : '○'}</span> Be at least 8 characters
              </div>
              <div className="tkt-rule-item" style={{ color: (hasUpper && hasLower) ? '#15803d' : '#64748b' }}>
                <span>{hasUpper && hasLower ? '✓' : '○'}</span> Include upper and lower case letters
              </div>
              <div className="tkt-rule-item" style={{ color: (hasDigit && hasSpecial) ? '#15803d' : '#64748b' }}>
                <span>{hasDigit && hasSpecial ? '✓' : '○'}</span> Include a number and a special character
              </div>
              {newPassword && (
                <div className="tkt-rule-item" style={{ color: matchesConfirm ? '#15803d' : '#dc2626' }}>
                  <span>{matchesConfirm ? '✓' : '○'}</span> Passwords match
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="tkt-btn-primary"
            >
              Save New Password &amp; Continue
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
