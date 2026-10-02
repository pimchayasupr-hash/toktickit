import { describe, it, expect, vi } from 'vitest';
import { getJwtSecret } from '../../src/middleware/authMiddleware';
import { isPasswordComplex } from '../../src/utils/validators';

describe('Lab 3 Unit Tests - Security & Production Guards', () => {
  describe('JWT_SECRET Production Guard (Security Item 6)', () => {
    it('throws fatal error at startup when NODE_ENV=production and JWT_SECRET is unset', () => {
      expect(() => {
        getJwtSecret({ NODE_ENV: 'production', JWT_SECRET: '' });
      }).toThrow(/FATAL: JWT_SECRET environment variable must be set in production mode/i);

      expect(() => {
        getJwtSecret({ NODE_ENV: 'production' });
      }).toThrow(/FATAL: JWT_SECRET environment variable must be set in production mode/i);
    });

    it('returns custom JWT_SECRET when properly configured in production', () => {
      const secret = getJwtSecret({ NODE_ENV: 'production', JWT_SECRET: 'super-secure-production-key-123!' });
      expect(secret).toBe('super-secure-production-key-123!');
    });

    it('falls back to local development secret and logs warning when unset in non-production', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const secret = getJwtSecret({ NODE_ENV: 'development', JWT_SECRET: '' });
      expect(secret).toBe('toktickit-dev-insecure-secret-key-2026');
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[SECURITY WARNING]'));
      consoleSpy.mockRestore();
    });
  });

  describe('Password Complexity Validator (BR-18, AC-23)', () => {
    it('accepts compliant passwords meeting min 8, uppercase, lowercase, digit, and special character', () => {
      expect(isPasswordComplex('Password123!')).toBe(true);
      expect(isPasswordComplex('Str0ng#Pass')).toBe(true);
      expect(isPasswordComplex('Admin$ecure2026')).toBe(true);
    });

    it('rejects passwords failing any complexity rule', () => {
      expect(isPasswordComplex('short1!')).toBe(false); // < 8
      expect(isPasswordComplex('NoDigitsHere!')).toBe(false); // no digit
      expect(isPasswordComplex('nolowercase123!')).toBe(false); // no lower
      expect(isPasswordComplex('NOUPPERCASE123!')).toBe(false); // no upper
      expect(isPasswordComplex('NoSpecialChar123')).toBe(false); // no special
      expect(isPasswordComplex('')).toBe(false);
      expect(isPasswordComplex(null)).toBe(false);
      expect(isPasswordComplex(undefined)).toBe(false);
    });
  });
});
