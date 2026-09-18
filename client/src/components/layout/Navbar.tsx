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
          <div className="tkt-brand-icon">⏱️</div>
          <div>
            <div className="tkt-brand-title">TikTockIT</div>
            <div className="tkt-brand-sub">IT Support System</div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="tkt-nav-menu">
          {user.role === 'REQUESTER' && (
            <>
              <button
                onClick={() => setActiveTab('my-tickets')}
                className={`tkt-nav-tab ${
                  activeTab === 'my-tickets' || activeTab === 'default' ? 'active' : ''
                }`}
              >
                <span>📄</span> My Queue
              </button>
              <button
                onClick={() => setActiveTab('create-ticket')}
                className={`tkt-nav-tab ${activeTab === 'create-ticket' ? 'active' : ''}`}
              >
                <span>➕</span> Create Ticket
              </button>
            </>
          )}

          {(user.role === 'STAFF' || user.role === 'ADMIN') && (
            <button
              onClick={() => setActiveTab('staff-queue')}
              className={`tkt-nav-tab ${
                activeTab === 'staff-queue' || activeTab === 'default' ? 'active' : ''
              }`}
            >
              <span>📄</span> My Queue
            </button>
          )}

          {user.role === 'ADMIN' && (
            <button
              onClick={() => setActiveTab('user-management')}
              className={`tkt-nav-tab ${activeTab === 'user-management' ? 'active' : ''}`}
            >
              <span>👥</span> User Management
            </button>
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
