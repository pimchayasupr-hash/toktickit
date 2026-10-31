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

  it('TEST-UI-ACT-04: Completed or Cancelled actions enforce terminal immutability (no Edit/Transition buttons)', async () => {
    const terminalActions = [
      {
        id: 1,
        ticketId: 10,
        actionDateTime: '2026-10-19T14:00:00.000Z',
        description: 'Replaced failed power supply unit.',
        result: 'PSU voltage rails stable at +12V, +5V, +3.3V.',
        status: 'COMPLETED',
        performedById: 2,
        performedBy: { id: 2, name: 'Michael Staff', email: 'michael.staff@toktickit.com' },
        version: 1,
        createdAt: '2026-10-19T14:05:00.000Z',
      },
      {
        id: 2,
        ticketId: 10,
        actionDateTime: '2026-10-19T14:30:00.000Z',
        description: 'Scheduled redundant cable check.',
        status: 'CANCELLED',
        performedById: 2,
        performedBy: { id: 2, name: 'Michael Staff', email: 'michael.staff@toktickit.com' },
        version: 1,
        createdAt: '2026-10-19T14:35:00.000Z',
      },
    ];

    vi.stubGlobal('fetch', vi.fn((url: string) => {
      if (url.includes('/actions-taken')) {
        return Promise.resolve(new Response(JSON.stringify({ actionsTaken: terminalActions }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }));
      }
      if (url.includes('/assignees')) {
        return Promise.resolve(new Response(JSON.stringify({ assignees: [] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }));
      }
      return Promise.reject(new Error('Unknown'));
    }));

    render(
      <AuthProvider>
        <ActionsTakenSection ticketId={10} isReadOnly={false} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Replaced failed power supply/i)).toBeDefined();
      expect(screen.getByText(/Scheduled redundant cable check/i)).toBeDefined();
    });

    // Zero Edit or quick transition buttons for terminal actions
    expect(screen.queryByRole('button', { name: /Edit/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /Start Work/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /✓ Complete/i })).toBeNull();
  });

  it('TEST-UI-ACT-05: Submitting Completed action without result displays client-side validation error', async () => {
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

    // Set status to COMPLETED
    const statusSelect = screen.getByLabelText(/Action Status/i);
    fireEvent.change(statusSelect, { target: { value: 'COMPLETED' } });

    // Enter description
    const descInput = screen.getByLabelText(/Action Description/i);
    fireEvent.change(descInput, { target: { value: 'Performed memory test diagnostic.' } });

    // Click Save Action without entering result
    const saveBtn = screen.getByRole('button', { name: /Save Action/i });
    fireEvent.click(saveBtn);

    // Must show validation error and link field-level error via aria-describedby
    await waitFor(() => {
      expect(screen.getAllByText(/Result is required when completing an Action Taken/i).length).toBeGreaterThan(0);
      expect(screen.getByTestId('field-error-result')).toBeDefined();
      expect(screen.getByLabelText(/Action Result/i).getAttribute('aria-describedby')).toBe('actionResult-error');
    });
  });
});
