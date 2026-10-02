import { describe, it, expect } from 'vitest';
import { getJwtSecret } from '../../src/middleware/authMiddleware';

describe('Lab 3 - JWT_SECRET Production Guard (BR-Security, AC-03)', () => {
  it('throws a fatal error at startup when NODE_ENV=production and JWT_SECRET is unset', () => {
    expect(() =>
      getJwtSecret({ NODE_ENV: 'production', JWT_SECRET: '' })
    ).toThrow(/FATAL: JWT_SECRET environment variable must be set in production mode/i);
  });

  it('throws when NODE_ENV=production and JWT_SECRET is undefined', () => {
    expect(() =>
      getJwtSecret({ NODE_ENV: 'production' })
    ).toThrow(/FATAL: JWT_SECRET environment variable must be set in production mode/i);
  });

  it('returns the env secret when NODE_ENV=production and JWT_SECRET is provided', () => {
    const secret = getJwtSecret({
      NODE_ENV: 'production',
      JWT_SECRET: 'super-secure-production-key-256-bits',
    });
    expect(secret).toBe('super-secure-production-key-256-bits');
  });

  it('falls back to dev key when NODE_ENV=development and JWT_SECRET is unset', () => {
    const secret = getJwtSecret({ NODE_ENV: 'development' });
    expect(typeof secret).toBe('string');
    expect(secret.length).toBeGreaterThan(0);
  });

  it('falls back to dev key when NODE_ENV=test and JWT_SECRET is unset', () => {
    const secret = getJwtSecret({ NODE_ENV: 'test' });
    expect(typeof secret).toBe('string');
    expect(secret.length).toBeGreaterThan(0);
  });
});
