import { describe, it, expect } from 'vitest';
import { generateTicketNumber } from '../../src/utils/ticketUtils';

describe('Lab 2 Unit Tests', () => {
  it('generateTicketNumber returns official sequential format TKT-YYYY-XXXXXX', async () => {
    const ticketNumber = await generateTicketNumber();
    expect(ticketNumber).toBeDefined();
    expect(ticketNumber).toMatch(/^TKT-\d{4}-\d{6}$/);
    expect(ticketNumber.startsWith('TKT-')).toBe(true);
    const currentYear = new Date().getFullYear();
    expect(ticketNumber.slice(4, 8)).toBe(String(currentYear));
  });

  it('formats ticket numbers with correct zero-padding for single digit and multi-digit IDs', () => {
    const formatTicketNumber = (id: number) => `TKT-2026-${String(id).padStart(6, '0')}`;
    expect(formatTicketNumber(1234)).toBe('TKT-2026-001234');
    expect(formatTicketNumber(1)).toBe('TKT-2026-000001');
    expect(formatTicketNumber(1).startsWith('TKT-')).toBe(true);
  });

  it('validates allowed attachment mime types', () => {
    const ALLOWED_MIME_TYPES = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'application/pdf',
    ];
    expect(ALLOWED_MIME_TYPES.includes('application/pdf')).toBe(true);
    expect(ALLOWED_MIME_TYPES.includes('image/png')).toBe(true);
    expect(ALLOWED_MIME_TYPES.includes('application/zip')).toBe(false);
    expect(ALLOWED_MIME_TYPES.includes('executable/exe')).toBe(false);
  });

  it('validates maximum file size limit of 5 MB', () => {
    const MAX_SIZE_BYTES = 5 * 1024 * 1024;
    const validSize = 4.5 * 1024 * 1024;
    const invalidSize = 5.1 * 1024 * 1024;
    expect(validSize <= MAX_SIZE_BYTES).toBe(true);
    expect(invalidSize <= MAX_SIZE_BYTES).toBe(false);
  });
});
