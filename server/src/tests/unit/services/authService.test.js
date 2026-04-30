/**
 * ============================================================
 *  UNIT TESTS — authService
 *
 *  Tests JWT signing/verification and the _safe() sanitizer.
 *  MongoDB-dependent methods (register, login, findById) are
 *  tested with a fully mocked User model so no real DB is needed.
 * ============================================================
 */

// ── Set JWT_SECRET BEFORE any imports so authService reads it ─────────────────
// authService reads process.env.JWT_SECRET lazily (via getSecret()), so we
// just need it set before the first call — but vitest module isolation means
// the setup.js runs first. We set it here as a belt-and-suspenders guard.
process.env.JWT_SECRET = 'test-jwt-secret-for-unit-tests';
process.env.JWT_EXPIRY = '7d';

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ── Mock the User model BEFORE importing authService ─────────────────────────
vi.mock('../../../models/User.js', () => ({
  User: {
    findOne:  vi.fn(),
    create:   vi.fn(),
    findById: vi.fn(),
  },
}));

// ── Mock bcrypt so tests run fast (no real hashing) ──────────────────────────
vi.mock('bcrypt', () => ({
  default: {
    hash:    vi.fn(async (pw) => `hashed_${pw}`),
    compare: vi.fn(async (plain, hashed) => hashed === `hashed_${plain}`),
  },
}));

import { authService } from '../../../services/authService.js';
import { User }        from '../../../models/User.js';
import bcrypt          from 'bcrypt';

// ─────────────────────────────────────────────────────────────────────────────
//  Fixtures
// ─────────────────────────────────────────────────────────────────────────────
const MOCK_USER = {
  _id:      'user-id-123',
  name:     'Rahim Farmer',
  username: 'rahimfarmer',
  email:    'rahim@example.com',
  password: 'hashed_password123',
  district: 'dhaka',
};

// ─────────────────────────────────────────────────────────────────────────────
//  sign / verify
// ─────────────────────────────────────────────────────────────────────────────
describe('authService › sign & verify', () => {

  it('✅ sign() returns a non-empty JWT string', () => {
    const token = authService.sign('user-id-abc');
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(20);
    expect(token.split('.')).toHaveLength(3); // header.payload.signature
  });

  it('✅ verify() decodes a token signed by sign()', () => {
    const token   = authService.sign('user-id-abc');
    const decoded = authService.verify(token);
    expect(decoded.userId).toBe('user-id-abc');
  });

  it('✅ verify() throws for a tampered token', () => {
    const token = authService.sign('user-id-abc');
    expect(() => authService.verify(token + 'tampered')).toThrow();
  });

  it('✅ verify() throws for a completely invalid string', () => {
    expect(() => authService.verify('not.a.jwt')).toThrow();
  });

  it('✅ two tokens for different users are different', () => {
    const t1 = authService.sign('user-1');
    const t2 = authService.sign('user-2');
    expect(t1).not.toBe(t2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  _safe
// ─────────────────────────────────────────────────────────────────────────────
describe('authService › _safe', () => {

  it('✅ returns _id, name, username, email, district', () => {
    const safe = authService._safe(MOCK_USER);
    expect(safe).toEqual({
      _id:      MOCK_USER._id,
      name:     MOCK_USER.name,
      username: MOCK_USER.username,
      email:    MOCK_USER.email,
      district: MOCK_USER.district,
    });
  });

  it('✅ does NOT include the password field', () => {
    const safe = authService._safe(MOCK_USER);
    expect(safe).not.toHaveProperty('password');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  register
// ─────────────────────────────────────────────────────────────────────────────
describe('authService › register', () => {

  beforeEach(() => {
    vi.clearAllMocks();
    // Default: no existing user
    User.findOne.mockResolvedValue(null);
    User.create.mockResolvedValue(MOCK_USER);
  });

  it('✅ returns user (safe) and token on success', async () => {
    const result = await authService.register({
      name: 'Rahim Farmer', username: 'rahimfarmer',
      email: 'rahim@example.com', password: 'password123', district: 'dhaka',
    });
    expect(result).toHaveProperty('user');
    expect(result).toHaveProperty('token');
    expect(result.user).not.toHaveProperty('password');
  });

  it('✅ hashes the password before storing', async () => {
    await authService.register({
      name: 'Rahim', username: 'rahim', email: 'r@e.com', password: 'pass123',
    });
    expect(bcrypt.hash).toHaveBeenCalledWith('pass123', 10);
  });

  it('✅ throws "Email already registered" when email exists', async () => {
    User.findOne.mockResolvedValueOnce(MOCK_USER); // email check hits
    await expect(authService.register({
      name: 'X', username: 'x', email: 'rahim@example.com', password: 'pass123',
    })).rejects.toThrow('Email already registered');
  });

  it('✅ throws "Username already taken" when username exists', async () => {
    User.findOne
      .mockResolvedValueOnce(null)        // email check passes
      .mockResolvedValueOnce(MOCK_USER);  // username check hits
    await expect(authService.register({
      name: 'X', username: 'rahimfarmer', email: 'new@example.com', password: 'pass123',
    })).rejects.toThrow('Username already taken');
  });

  it('✅ district defaults to empty string when not provided', async () => {
    await authService.register({
      name: 'Rahim', username: 'rahim', email: 'r@e.com', password: 'pass123',
    });
    expect(User.create).toHaveBeenCalledWith(
      expect.objectContaining({ district: '' })
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  login
// ─────────────────────────────────────────────────────────────────────────────
describe('authService › login', () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('✅ returns user (safe) and token on valid credentials', async () => {
    User.findOne.mockResolvedValue(MOCK_USER);
    bcrypt.compare.mockResolvedValue(true);

    const result = await authService.login({ email: 'rahim@example.com', password: 'password123' });
    expect(result).toHaveProperty('user');
    expect(result).toHaveProperty('token');
    expect(result.user).not.toHaveProperty('password');
  });

  it('✅ throws "Invalid email or password" when user not found', async () => {
    User.findOne.mockResolvedValue(null);
    await expect(authService.login({ email: 'nobody@example.com', password: 'pass' }))
      .rejects.toThrow('Invalid email or password');
  });

  it('✅ throws "Invalid email or password" when password is wrong', async () => {
    User.findOne.mockResolvedValue(MOCK_USER);
    bcrypt.compare.mockResolvedValue(false);
    await expect(authService.login({ email: 'rahim@example.com', password: 'wrongpass' }))
      .rejects.toThrow('Invalid email or password');
  });

  it('✅ token is a valid JWT that decodes to the user id', async () => {
    User.findOne.mockResolvedValue(MOCK_USER);
    bcrypt.compare.mockResolvedValue(true);

    const { token } = await authService.login({ email: 'rahim@example.com', password: 'password123' });
    const decoded   = authService.verify(token);
    expect(decoded.userId).toBe(MOCK_USER._id);
  });
});
