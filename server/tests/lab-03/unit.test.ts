import { describe, it, expect } from 'vitest';
import { isValidPassword, isValidCommentLength, isValidTransition, VALID_TRANSITIONS } from '../../src/utils/validators';

describe('Lab 3 Unit Tests - Validators & Business Logic', () => {
  describe('Password Complexity Validator Boundaries (BR-02)', () => {
    it('should reject passwords shorter than 8 characters', () => {
      expect(isValidPassword('Aa1!abc')).toBe(false); // 7 characters
      expect(isValidPassword('Aa1!')).toBe(false); // 4 characters
    });

    it('should accept passwords with 8 or more characters meeting all rules', () => {
      expect(isValidPassword('Aa1!abcd')).toBe(true); // 8 characters
      expect(isValidPassword('SuperSecurePassword123!@#')).toBe(true); // 26 characters
    });

    it('should reject passwords missing an uppercase letter', () => {
      expect(isValidPassword('password123!')).toBe(false);
    });

    it('should reject passwords missing a lowercase letter', () => {
      expect(isValidPassword('PASSWORD123!')).toBe(false);
    });

    it('should reject passwords missing a number', () => {
      expect(isValidPassword('Password!@#$')).toBe(false);
    });

    it('should reject passwords missing a special character', () => {
      expect(isValidPassword('Password12345')).toBe(false);
    });

    it('should reject empty or non-string inputs', () => {
      expect(isValidPassword('')).toBe(false);
      expect(isValidPassword(null as any)).toBe(false);
      expect(isValidPassword(undefined as any)).toBe(false);
    });
  });

  describe('Comment & Note Length Trimming and Boundaries', () => {
    it('should reject empty comments or pure whitespace', () => {
      expect(isValidCommentLength('').valid).toBe(false);
      expect(isValidCommentLength('   \n\t  ').valid).toBe(false);
    });

    it('should accept minimum length of 1 character after trimming', () => {
      const res = isValidCommentLength('  A  ');
      expect(res.valid).toBe(true);
      expect(res.trimmed).toBe('A');
    });

    it('should accept maximum length of 2000 characters', () => {
      const text2000 = 'x'.repeat(2000);
      const res = isValidCommentLength(text2000);
      expect(res.valid).toBe(true);
      expect(res.trimmed.length).toBe(2000);
    });

    it('should reject comments exceeding 2000 characters', () => {
      const text2001 = 'x'.repeat(2001);
      expect(isValidCommentLength(text2001).valid).toBe(false);
    });

    it('should handle whitespace trimming properly before measuring length', () => {
      const text2000WithPadding = `   ${'x'.repeat(2000)}   `;
      const res = isValidCommentLength(text2000WithPadding);
      expect(res.valid).toBe(true);
      expect(res.trimmed.length).toBe(2000);
    });
  });

  describe('Ticket Status Transitions (BR-10 Matrix)', () => {
    it('should allow valid transitions from NEW', () => {
      expect(isValidTransition('NEW', 'OPEN')).toBe(true);
      expect(isValidTransition('NEW', 'IN_PROGRESS')).toBe(true);
      expect(isValidTransition('NEW', 'CANCELLED')).toBe(true);
    });

    it('should reject invalid transitions from NEW', () => {
      expect(isValidTransition('NEW', 'RESOLVED')).toBe(false);
      expect(isValidTransition('NEW', 'CLOSED')).toBe(false);
      expect(isValidTransition('NEW', 'WAITING_FOR_REQUESTER')).toBe(false);
    });

    it('should allow valid transitions from IN_PROGRESS', () => {
      expect(isValidTransition('IN_PROGRESS', 'WAITING_FOR_REQUESTER')).toBe(true);
      expect(isValidTransition('IN_PROGRESS', 'RESOLVED')).toBe(true);
      expect(isValidTransition('IN_PROGRESS', 'CANCELLED')).toBe(true);
      expect(isValidTransition('IN_PROGRESS', 'OPEN')).toBe(true);
    });

    it('should allow valid transitions from RESOLVED and CLOSED', () => {
      expect(isValidTransition('RESOLVED', 'CLOSED')).toBe(true);
      expect(isValidTransition('RESOLVED', 'REOPENED')).toBe(true);
      expect(isValidTransition('CLOSED', 'REOPENED')).toBe(true);
    });

    it('should prevent transitions from CANCELLED', () => {
      expect(VALID_TRANSITIONS['CANCELLED']).toEqual([]);
      expect(isValidTransition('CANCELLED', 'NEW')).toBe(false);
      expect(isValidTransition('CANCELLED', 'OPEN')).toBe(false);
      expect(isValidTransition('CANCELLED', 'REOPENED')).toBe(false);
    });
  });
});
