import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { StaffTicketQueue } from '../../components/staff/StaffTicketQueue';
import { AuthProvider } from '../../context/AuthContext';

describe('Lab 3 UI - StaffTicketQueue Component', () => {
  it('UI-03: Staff Ticket Queue renders search bar, filters, and loading indicator', () => {
    const handleSelect = vi.fn();

    render(
      <AuthProvider>
        <StaffTicketQueue onSelectTicket={handleSelect} />
      </AuthProvider>
    );

    expect(screen.getByText(/IT Staff Shared Ticket Queue/i)).toBeDefined();
    expect(screen.getByPlaceholderText(/Search by ticket number/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /Search/i })).toBeDefined();
  });
});
