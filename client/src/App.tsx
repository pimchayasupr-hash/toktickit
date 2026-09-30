import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginForm } from './components/auth/LoginForm';
import { ChangePasswordModal } from './components/auth/ChangePasswordModal';
import { Navbar } from './components/layout/Navbar';
import { MyTickets } from './components/MyTickets';
import { CreateTicket } from './components/CreateTicket';
import { TicketDetail } from './components/TicketDetail';
import { StaffTicketQueue } from './components/staff/StaffTicketQueue';
import { StaffTicketDetail } from './components/staff/StaffTicketDetail';
import { UserManagement } from './components/admin/UserManagement';

const MainAppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('default');
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-emerald-600 border-t-transparent mb-3"></div>
          <p className="text-sm font-medium text-slate-600">Initializing TokTickIT session...</p>
        </div>
      </div>
    );
  }

  // Not logged in -> Show Login Form
  if (!user) {
    return <LoginForm />;
  }

  // Must change password -> Show Change Password Modal overlay
  if (user.mustChangePassword) {
    return <ChangePasswordModal />;
  }

  // Handle default tab according to role
  const effectiveTab =
    activeTab === 'default'
      ? user.role === 'REQUESTER'
        ? 'my-tickets'
        : user.role === 'STAFF'
        ? 'staff-queue'
        : 'user-management'
      : activeTab;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <Navbar
        activeTab={effectiveTab}
        setActiveTab={(tab) => {
          setSelectedTicketId(null);
          setActiveTab(tab);
        }}
      />

      <main className="flex-grow">
        {selectedTicketId !== null ? (
          user.role === 'REQUESTER' ? (
            <TicketDetail ticketId={selectedTicketId} onBack={() => setSelectedTicketId(null)} />
          ) : (
            <StaffTicketDetail ticketId={selectedTicketId} onBack={() => setSelectedTicketId(null)} />
          )
        ) : effectiveTab === 'my-tickets' && user.role === 'REQUESTER' ? (
          <MyTickets
            onSelectTicket={(id) => setSelectedTicketId(id)}
            onCreateNewTicket={() => setActiveTab('create-ticket')}
          />
        ) : effectiveTab === 'create-ticket' && user.role === 'REQUESTER' ? (
          <CreateTicket
            onSuccess={(ticket) => {
              setSelectedTicketId(ticket.id);
            }}
            onCancel={() => setActiveTab('my-tickets')}
          />
        ) : effectiveTab === 'staff-queue' && (user.role === 'STAFF' || user.role === 'ADMIN') ? (
          <StaffTicketQueue onSelectTicket={(id) => setSelectedTicketId(id)} />
        ) : effectiveTab === 'user-management' && user.role === 'ADMIN' ? (
          <UserManagement />
        ) : (
          <div className="max-w-4xl mx-auto p-12 text-center">
            <h3 className="text-xl font-bold text-slate-800">Welcome to TokTickIT</h3>
            <p className="text-sm text-slate-600 mt-2">Use the navigation bar above to manage your tickets and services.</p>
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        TokTickIT v3.0 &copy; 2026 CPE 334 Software Engineering. Zen Green Design System.
      </footer>
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}

export default App;
