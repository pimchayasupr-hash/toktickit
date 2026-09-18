import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export const LoginForm: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage('Please enter both email address and password.');
      return;
    }

    setSubmitting(true);
    const result = await login(email.trim(), password);
    setSubmitting(false);

    if (!result.success) {
      const err = (result as any).error || 'Invalid email or password. Please try again.';
      setErrorMessage(err);
    }
  };

  return (
    <div className="tkt-auth-page">
      <div className="tkt-auth-card">
        {/* TokTickIT Brand Header Bar */}
        <div className="tkt-auth-header-bar">
          <div className="tkt-brand-icon">⏱️</div>
          <div>
            <div className="tkt-brand-title">TokTickIT</div>
          </div>
        </div>

        <div className="tkt-auth-body">
          <h2 className="tkt-auth-title">Sign in to your account</h2>
          <p className="tkt-auth-subtitle">Manage and track IT support tickets under your account</p>

          {errorMessage && (
            <div role="alert" className="tkt-alert-error">
              <span style={{ fontSize: '1.1rem' }}>⚠️</span>
              <div>{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="tkt-form-group">
              <label htmlFor="email" className="tkt-label">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@toktickit.com"
                className="tkt-input"
              />
            </div>

            <div className="tkt-form-group">
              <label htmlFor="password" className="tkt-label">
                Password
              </label>
              <div className="tkt-input-wrapper">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="tkt-input"
                  style={{ paddingRight: '2.5rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="tkt-input-icon-btn"
                  tabIndex={-1}
                  title={showPassword ? 'Hide' : 'Show'}
                  aria-label={showPassword ? 'Hide' : 'Show'}
                >
                  {showPassword ? (
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

            <div style={{ marginTop: '1.5rem', marginBottom: '1.25rem' }}>
              <button
                type="submit"
                disabled={submitting}
                className="tkt-btn-primary"
              >
                {submitting ? 'Signing in...' : 'Sign In'}
              </button>
            </div>

            <div style={{ textAlign: 'center' }}>
              <a
                href="#forgot-password"
                onClick={(e) => { e.preventDefault(); alert('Please contact your IT administrator to reset your password.'); }}
                style={{ fontSize: '0.8rem', color: 'var(--brand-green-primary)', textDecoration: 'none', fontWeight: 500 }}
              >
                Forgot your password?
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
