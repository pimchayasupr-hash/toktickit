import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { StaffTicketDetail } from '../../components/staff/StaffTicketDetail';
import { AuthProvider } from '../../context/AuthContext';

describe('Lab 3 UI - StaffTicketDetail Component', () => {
  it('UI-04: Staff Ticket Detail renders loading state initially', () => {
    const handleBack = vi.fn();

    render(
      <AuthProvider>
        <StaffTicketDetail ticketId={1} onBack={handleBack} />
      </AuthProvider>
    );

    expect(screen.getByText(/Loading ticket detail/i)).toBeDefined();
  });
});
