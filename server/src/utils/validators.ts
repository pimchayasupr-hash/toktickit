export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export function isValidPassword(password: string): boolean {
  if (!password || typeof password !== 'string') return false;
  return PASSWORD_REGEX.test(password);
}

export function isValidCommentLength(content: string, min = 1, max = 2000): { valid: boolean; trimmed: string } {
  if (typeof content !== 'string') {
    return { valid: false, trimmed: '' };
  }
  const trimmed = content.trim();
  const valid = trimmed.length >= min && trimmed.length <= max;
  return { valid, trimmed };
}

export const VALID_TRANSITIONS: Record<string, string[]> = {
  NEW: ['OPEN', 'IN_PROGRESS', 'CANCELLED'],
  OPEN: ['WAITING_FOR_REQUESTER', 'RESOLVED', 'CANCELLED', 'IN_PROGRESS'],
  IN_PROGRESS: ['WAITING_FOR_REQUESTER', 'RESOLVED', 'CANCELLED', 'OPEN'],
  WAITING_FOR_REQUESTER: ['IN_PROGRESS', 'RESOLVED', 'CANCELLED'],
  RESOLVED: ['CLOSED', 'REOPENED'],
  CLOSED: ['REOPENED'],
  REOPENED: ['IN_PROGRESS', 'RESOLVED', 'CANCELLED'],
  CANCELLED: [],
};

export function isValidTransition(fromStatus: string, toStatus: string): boolean {
  const allowed = VALID_TRANSITIONS[fromStatus];
  if (!allowed) return false;
  return allowed.includes(toStatus);
}
