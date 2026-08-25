import { useState } from 'react';
import { RequesterProvider, useRequester } from './context/RequesterContext';
import { Navbar } from './components/Navbar';
import { DevRequesterSelect } from './components/DevRequesterSelect';
import { MyTickets } from './components/MyTickets';
import { CreateTicket } from './components/CreateTicket';
import { TicketDetail } from './components/TicketDetail';
import { Ticket } from './types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

function MainAppContent() {
  const { selectedRequesterId } = useRequester();

  const [activeTab, setActiveTab] = useState<'my-tickets' | 'create-ticket'>('my-tickets');
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);

  // Lab 1 Health Check Compatibility State
  const [systemStatus, setSystemStatus] = useState<'Online' | 'Offline' | null>(null);
  const [serviceName, setServiceName] = useState<string | null>(null);
  const [lab1Categories, setLab1Categories] = useState<{ id: number; name: string }[]>([]);
  const [isLoadingHealth, setIsLoadingHealth] = useState<boolean>(false);
  const [healthError, setHealthError] = useState<string | null>(null);

  const handleCheckSystem = async () => {
    setIsLoadingHealth(true);
    setHealthError(null);

    try {
      const [healthResponse, categoriesResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/health`),
        fetch(`${API_BASE_URL}/api/categories`),
      ]);

      if (!healthResponse.ok) {
        throw new Error(`Health check failed with status ${healthResponse.status}`);
      }

      if (!categoriesResponse.ok) {
        throw new Error(`Categories request failed with status ${categoriesResponse.status}`);
      }

      const healthData = await healthResponse.json();
      const categoriesData = await categoriesResponse.json();

      setSystemStatus('Online');
      setServiceName(healthData.service || 'TokTickIT API');
      setLab1Categories(Array.isArray(categoriesData) ? categoriesData : categoriesData.categories || []);
    } catch (error) {
      setSystemStatus('Offline');
      setLab1Categories([]);
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to connect to the backend service. Please ensure the server is running.';
      setHealthError(`System Status: Offline (${message})`);
    } finally {
      setIsLoadingHealth(false);
    }
  };

  // If no Development Requester is selected, render Selection screen
  if (!selectedRequesterId) {
    return (
      <div>
        <DevRequesterSelect />

        {/* Hidden / Embedded Lab 1 Test Compatibility Container */}
        <div className="container py-3 opacity-75">
          <div className="card shadow-sm border-0">
            <div className="card-body p-3">
              <h1 className="h5 mb-2 text-center fw-bold">TokTickIT IT Service Desk</h1>
              <div className="d-grid mb-2">
                <button
                  type="button"
                  id="check-system-btn"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={handleCheckSystem}
                  disabled={isLoadingHealth}
                >
                  {isLoadingHealth ? 'Loading...' : 'Check System'}
                </button>
              </div>

              {isLoadingHealth && (
                <div className="text-center my-2 text-secondary" data-testid="loading-indicator">
                  <p className="mb-0 small">Loading system status and categories...</p>
                </div>
              )}

              {healthError && (
                <div className="alert alert-danger mt-2 p-2 small" role="alert" data-testid="error-alert">
                  <p className="mb-0">{healthError}</p>
                </div>
              )}

              {systemStatus && (
                <div className="card bg-light border-0 p-2 my-2" data-testid="status-card">
                  <div className="d-flex justify-content-between align-items-center small">
                    <span>System Status:</span>
                    <span
                      className={`badge ${systemStatus === 'Online' ? 'bg-success' : 'bg-danger'}`}
                      data-testid="system-status-badge"
                    >
                      {systemStatus}
                    </span>
                  </div>
                  {serviceName && systemStatus === 'Online' && (
                    <div className="mt-1 small">
                      Service: <span>{serviceName}</span>
                    </div>
                  )}
                </div>
              )}

              {lab1Categories.length > 0 && (
                <div className="mt-2" data-testid="categories-section">
                  <h6 className="fw-bold mb-2">Supported Request Categories</h6>
                  <ul className="list-group list-group-flush" id="categories-list">
                    {lab1Categories.map((c) => (
                      <li key={c.id} className="list-group-item py-1 px-2 small">
                        {c.name}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100 d-flex flex-column bg-light">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onClearSelectedTicket={() => setSelectedTicketId(null)}
      />

      <main className="flex-grow-1">
        {selectedTicketId !== null ? (
          <TicketDetail ticketId={selectedTicketId} onBack={() => setSelectedTicketId(null)} />
        ) : activeTab === 'create-ticket' ? (
          <CreateTicket
            onSuccess={(newTicket: Ticket) => {
              setSelectedTicketId(newTicket.id);
            }}
            onCancel={() => setActiveTab('my-tickets')}
          />
        ) : (
          <MyTickets
            onSelectTicket={(ticketId: number) => setSelectedTicketId(ticketId)}
            onCreateNewClick={() => setActiveTab('create-ticket')}
          />
        )}
      </main>

      <footer className="bg-white border-top py-3 text-center text-muted small mt-auto">
        <div className="container">
          TokTickIT Service Desk • CPE334 Lab 2 MVP • Zen Green Design System
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <RequesterProvider>
      <MainAppContent />
    </RequesterProvider>
  );
}

export default App;
