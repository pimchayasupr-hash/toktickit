import React from 'react';
import { useRequester } from '../context/RequesterContext';

interface NavbarProps {
  activeTab: 'my-tickets' | 'create-ticket';
  setActiveTab: (tab: 'my-tickets' | 'create-ticket') => void;
  onClearSelectedTicket?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, onClearSelectedTicket }) => {
  const { currentRequester, clearRequester } = useRequester();

  const handleTabClick = (tab: 'my-tickets' | 'create-ticket') => {
    if (onClearSelectedTicket) onClearSelectedTicket();
    setActiveTab(tab);
  };

  return (
    <nav className="navbar navbar-expand-lg bg-zen-primary shadow-sm mb-4">
      <div className="container">
        <a
          className="navbar-brand text-white fw-bold d-flex align-items-center cursor-pointer"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            handleTabClick('my-tickets');
          }}
        >
          <span className="fs-4 me-2">🎟️</span>
          TokTickIT
        </a>

        <div className="d-flex align-items-center ms-auto">
          <ul className="navbar-nav me-3 d-flex flex-row align-items-center">
            <li className="nav-item me-2">
              <button
                type="button"
                className={`btn btn-sm ${activeTab === 'my-tickets' ? 'btn-light fw-bold text-success' : 'btn-outline-light'}`}
                onClick={() => handleTabClick('my-tickets')}
              >
                My Tickets
              </button>
            </li>
            <li className="nav-item">
              <button
                type="button"
                className={`btn btn-sm ${activeTab === 'create-ticket' ? 'btn-light fw-bold text-success' : 'btn-outline-light'}`}
                onClick={() => handleTabClick('create-ticket')}
              >
                + Create Ticket
              </button>
            </li>
          </ul>

          {currentRequester && (
            <div className="d-flex align-items-center bg-white bg-opacity-10 rounded px-3 py-1 text-white">
              <div className="me-3 text-end d-none d-sm-block">
                <div className="fw-semibold text-white small">{currentRequester.name}</div>
                <div className="text-white-50 extra-small">{currentRequester.email}</div>
              </div>
              <button
                type="button"
                className="btn btn-outline-light btn-sm ms-2"
                onClick={clearRequester}
                title="Switch active Development Requester identity"
              >
                Change Requester
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
