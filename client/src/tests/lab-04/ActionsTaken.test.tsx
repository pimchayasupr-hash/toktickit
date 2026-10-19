import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ActionsTakenSection } from '../../components/staff/ActionsTakenSection';
import { AuthProvider } from '../../context/AuthContext';

describe('Lab 4 UI - ActionsTakenSection Component', () => {
  const mockActions = [
    {
      id: 1,
      ticketId: 10,
      actionDateTime: '2026-10-19T14:00:00.000Z',
      description: 'Tested fiber transceiver power level.',
      result: 'Rx power is -14dBm (acceptable range).',
      performedById: 2,
      performedBy: { id: 2, name: 'Michael Staff', email: 'michael.staff@toktickit.com' },
      followUpRequired: true,
      followUpNote: 'Re-test when core traffic peaks at 15:00.',
      attachmentNotes: 'See optical power meter screenshot',
      version: 1,
      createdAt: '2026-10-19T14:05:00.000Z',
    },
  ];

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn((url: string) => {
      if (url.includes('/actions-taken')) {
        return Promise.resolve(new Response(JSON.stringify({ actionsTaken: mockActions }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }));
      }
      return Promise.reject(new Error('Unknown'));
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('TEST-UI-ACT-01: Toggling Follow-up Required reveals Follow-up Note textarea', async () => {
    render(
      <AuthProvider>
        <ActionsTakenSection ticketId={10} isReadOnly={false} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Tested fiber transceiver/i)).toBeDefined();
    });

    // Open add action form
    const addBtn = screen.getByRole('button', { name: /\+ Add Action/i });
    fireEvent.click(addBtn);

    // Follow-up checkbox
    const followUpCheckbox = screen.getByLabelText(/Follow-Up Required/i);
    expect(screen.queryByLabelText(/Follow-Up Note/i)).toBeNull();

    // Toggle on
    fireEvent.click(followUpCheckbox);
    expect(screen.getByLabelText(/Follow-Up Note/i)).toBeDefined();
  });

  it('TEST-UI-ACT-03: Read-only mode renders actions list without write controls for Requesters', async () => {
    render(
      <AuthProvider>
        <ActionsTakenSection ticketId={10} isReadOnly={true} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Tested fiber transceiver/i)).toBeDefined();
    });

    // Write buttons must not exist
    expect(screen.queryByRole('button', { name: /\+ Add Action/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /Edit/i })).toBeNull();
  });
});
