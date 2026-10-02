import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { StaffTicketDetail } from '../../components/staff/StaffTicketDetail';
import { AuthProvider } from '../../context/AuthContext';

describe('Lab 3 UI - Safe Failure Feedback for Attachment Download (Handout §10 & Part C)', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn((url: string) => {
      if (url.includes('/api/staff/assignees')) {
        return Promise.resolve(new Response(JSON.stringify({ assignees: [] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }));
      }
      if (url.includes('/api/staff/tickets/1')) {
        return Promise.resolve(new Response(JSON.stringify({
          ticket: {
            id: 1,
            ticketNumber: 'TKT-2026-000001',
            summary: 'Network outage in building B',
            description: 'Cannot connect to Wi-Fi AP.',
            currentStatus: 'OPEN',
            requestedPriority: 'HIGH',
            itPriority: 'HIGH',
            createdAt: new Date().toISOString(),
            category: { id: 1, name: 'Network' },
            relatedSystem: { id: 1, name: 'Campus Wi-Fi' },
            requester: { id: 1, name: 'Jennifer Anderson', email: 'jennifer.anderson@example.com' },
            owner: null,
            attachments: [
              {
                id: 101,
                originalFilename: 'diagnostic-report.log',
                sizeBytes: 4096,
                mimeType: 'text/plain',
                removedAt: null,
              },
            ],
            publicComments: [],
            internalNotes: [],
          },
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }));
      }
      if (url.includes('/api/attachments/101/download')) {
        return Promise.resolve(new Response(JSON.stringify({
          error: { code: 'NOT_FOUND', message: 'Attachment file not found on disk.' },
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }));
      }
      return Promise.reject(new Error(`Unhandled URL: ${url}`));
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('displays visible safe failure feedback alert on screen when download fails with 404', async () => {
    const handleBack = vi.fn();

    render(
      <AuthProvider>
        <StaffTicketDetail ticketId={1} onBack={handleBack} />
      </AuthProvider>
    );

    // Wait for ticket and attachment button to render
    const downloadBtn = await screen.findByText(/diagnostic-report\.log/i);
    expect(downloadBtn).toBeDefined();

    // Verify no alert exists before clicking download
    expect(screen.queryByRole('alert')).toBeNull();

    // Trigger download
    fireEvent.click(downloadBtn);

    // Verify safe failure feedback appears on screen
    const alertBox = await screen.findByRole('alert');
    expect(alertBox).toBeDefined();
    expect(alertBox.textContent).toMatch(/Attachment file not found on disk/i);
  });
});
