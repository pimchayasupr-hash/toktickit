import React from 'react';
import { useAuth } from '../../context/AuthContext';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const { user, logout } = useAuth();

  if (!user) return null;

  const roleLabel =
    user.role === 'ADMIN' ? 'Administrator' : user.role === 'STAFF' ? 'IT Support' : 'Requester';

  const userInitials = user.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  return (
    <header className="tkt-navbar">
      <div className="tkt-nav-container">
        {/* Brand Logo & Title */}
        <div className="tkt-brand" onClick={() => setActiveTab('default')} title="TokTickIT Home">
          <div className="tkt-brand-icon">
            <svg width="20" height="20" className="w-5 h-5 text-emerald-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <div className="tkt-brand-title">TokTickIT</div>
            <div className="tkt-brand-sub">IT Support System</div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="tkt-nav-menu">
          {user.role === 'REQUESTER' && (
            <>
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`tkt-nav-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
              >
                <svg width="16" height="16" className="w-4 h-4 inline-block mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('my-tickets')}
                className={`tkt-nav-tab ${
                  activeTab === 'my-tickets' || activeTab === 'default' ? 'active' : ''
                }`}
              >
                <svg width="16" height="16" className="w-4 h-4 inline-block mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                My Tickets
              </button>
              <button
                onClick={() => setActiveTab('create-ticket')}
                className={`tkt-nav-tab ${activeTab === 'create-ticket' ? 'active' : ''}`}
              >
                <svg width="16" height="16" className="w-4 h-4 inline-block mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Create Ticket
              </button>
            </>
          )}

          {user.role === 'STAFF' && (
            <>
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`tkt-nav-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
              >
                <svg width="16" height="16" className="w-4 h-4 inline-block mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('staff-queue')}
                className={`tkt-nav-tab ${
                  activeTab === 'staff-queue' || activeTab === 'default' ? 'active' : ''
                }`}
              >
                <svg width="16" height="16" className="w-4 h-4 inline-block mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Ticket Queue
              </button>
            </>
          )}

          {user.role === 'ADMIN' && (
            <>
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`tkt-nav-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
              >
                <svg width="16" height="16" className="w-4 h-4 inline-block mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('staff-queue')}
                className={`tkt-nav-tab ${activeTab === 'staff-queue' ? 'active' : ''}`}
              >
                <svg width="16" height="16" className="w-4 h-4 inline-block mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Ticket Queue
              </button>
              <button
                onClick={() => setActiveTab('user-management')}
                className={`tkt-nav-tab ${
                  activeTab === 'user-management' || activeTab === 'default' ? 'active' : ''
                }`}
              >
                <svg width="16" height="16" className="w-4 h-4 inline-block mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                User Management
              </button>
            </>
          )}
        </nav>

        {/* Authenticated User Profile & Logout */}
        <div className="tkt-nav-profile">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div className="tkt-avatar-circle" title={user.name}>
              {userInitials}
            </div>
            <div className="tkt-user-text" style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff', lineHeight: 1.1 }}>
                {user.name}
              </span>
              <span style={{ fontSize: '0.7rem', color: '#a7f3d0' }}>
                {roleLabel}
              </span>
            </div>
          </div>

          <button
            onClick={logout}
            title="Sign Out"
            className="tkt-btn-logout"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};
