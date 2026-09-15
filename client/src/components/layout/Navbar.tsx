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
    user.role === 'ADMIN' ? 'Administrator' : user.role === 'STAFF' ? 'IT Staff' : 'Requester';

  const roleBadgeStyle =
    user.role === 'ADMIN'
      ? 'bg-purple-100 text-purple-800 border-purple-200'
      : user.role === 'STAFF'
      ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
      : 'bg-blue-100 text-blue-800 border-blue-200';

  return (
    <header className="bg-[#005a36] text-white shadow-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('default')}>
            <span className="text-2xl">⏱️</span>
            <div>
              <h1 className="font-extrabold text-xl tracking-tight leading-none text-white">TokTickIT</h1>
              <span className="text-[10px] text-emerald-200 font-medium tracking-wide uppercase">IT Support System</span>
            </div>
          </div>

          {/* Navigation Links based on Role */}
          <nav className="hidden md:flex space-x-2">
            {user.role === 'REQUESTER' && (
              <>
                <button
                  onClick={() => setActiveTab('my-tickets')}
                  className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'my-tickets' || activeTab === 'default'
                      ? 'bg-emerald-800 text-white shadow-inner'
                      : 'text-emerald-100 hover:bg-[#008751]'
                  }`}
                >
                  My Tickets
                </button>
                <button
                  onClick={() => setActiveTab('create-ticket')}
                  className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'create-ticket'
                      ? 'bg-emerald-800 text-white shadow-inner'
                      : 'text-emerald-100 hover:bg-[#008751]'
                  }`}
                >
                  + Create Ticket
                </button>
              </>
            )}

            {(user.role === 'STAFF' || user.role === 'ADMIN') && (
              <button
                onClick={() => setActiveTab('staff-queue')}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'staff-queue' || activeTab === 'default'
                    ? 'bg-emerald-800 text-white shadow-inner'
                    : 'text-emerald-100 hover:bg-[#008751]'
                }`}
              >
                📋 Shared Queue
              </button>
            )}

            {user.role === 'ADMIN' && (
              <button
                onClick={() => setActiveTab('user-management')}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'user-management'
                    ? 'bg-emerald-800 text-white shadow-inner'
                    : 'text-emerald-100 hover:bg-[#008751]'
                }`}
              >
                👥 User Management
              </button>
            )}
          </nav>

          {/* Authenticated User Profile & Logout */}
          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-2 text-right">
              <div>
                <div className="text-sm font-semibold text-white leading-tight">{user.name}</div>
                <div className="text-xs text-emerald-200">{user.email}</div>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${roleBadgeStyle}`}>
                {roleLabel}
              </span>
            </div>

            <button
              onClick={logout}
              title="Sign Out"
              className="px-3 py-1.5 text-xs font-semibold bg-emerald-900/80 hover:bg-red-700 text-white rounded-lg border border-emerald-700 transition-colors shadow-sm"
            >
              Logout 🚪
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
