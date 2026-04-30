/**
 * ============================================================
 *  UNIT TESTS — authController (signup, signin, profile)
 *
 *  authService is fully mocked — no DB, no real JWT.
 *  We test HTTP-level behaviour: status codes, response shape,
 *  and input validation.
 * ============================================================
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock authService ──────────────────────────────────────────────────────────
vi.mock('../../../services/authService.js', () => ({
  authService: {
    register: vi.fn(),
    login:    vi.fn(),
  },
}));

import { signup, signin, profile } from '../../../controllers/authController.js';
import { authService }             from '../../../services/authService.js';

// ─────────────────────────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────────────────────────
function makeRes() {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json   = vi.fn().mockReturnValue(res);
  return res;
}

const VALID_SIGNUP_BODY = {
  name: 'Rahim Farmer', username: 'rahimfarmer',
  email: 'rahim@example.com', password: 'password123', district: 'dhaka',
};

const AUTH_RESULT = {
  user:  { _id: 'uid-1', name: 'Rahim Farmer', email: 'rahim@example.com' },
  token: 'jwt.token.here',
};

// ─────────────────────────────────────────────────────────────────────────────
//  signup
// ─────────────────────────────────────────────────────────────────────────────
describe('authController › signup', () => {

  beforeEach(() => vi.clearAllMocks());

  // ── Input validation ─────────────────────────────────────────────────────────
  describe('input validation', () => {
    it('✅ returns 400 when name is missing', async () => {
      const req = { body: { ...VALID_SIGNUP_BODY, name: undefined } };
      const res = makeRes();
      await signup(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
    });

    it('✅ returns 400 when username is missing', async () => {
      const req = { body: { ...VALID_SIGNUP_BODY, username: undefined } };
      const res = makeRes();
      await signup(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('✅ returns 400 when email is missing', async () => {
      const req = { body: { ...VALID_SIGNUP_BODY, email: undefined } };
      const res = makeRes();
      await signup(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('✅ returns 400 when password is missing', async () => {
      const req = { body: { ...VALID_SIGNUP_BODY, password: undefined } };
      const res = makeRes();
      await signup(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('✅ returns 400 when password is shorter than 6 characters', async () => {
      const req = { body: { ...VALID_SIGNUP_BODY, password: '12345' } };
      const res = makeRes();
      await signup(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      const [call] = res.json.mock.calls;
      expect(call[0].error).toMatch(/6 characters/i);
    });

    it('✅ accepts password of exactly 6 characters', async () => {
      authService.register.mockResolvedValue(AUTH_RESULT);
      const req = { body: { ...VALID_SIGNUP_BODY, password: '123456' } };
      const res = makeRes();
      await signup(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  // ── Success path ─────────────────────────────────────────────────────────────
  describe('success', () => {
    it('✅ returns 201 with user and token on valid input', async () => {
      authService.register.mockResolvedValue(AUTH_RESULT);
      const req = { body: VALID_SIGNUP_BODY };
      const res = makeRes();
      await signup(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(AUTH_RESULT);
    });

    it('✅ calls authService.register with the correct payload', async () => {
      authService.register.mockResolvedValue(AUTH_RESULT);
      const req = { body: VALID_SIGNUP_BODY };
      await signup(req, makeRes());
      expect(authService.register).toHaveBeenCalledWith(VALID_SIGNUP_BODY);
    });
  });

  // ── Service errors ───────────────────────────────────────────────────────────
  describe('service errors', () => {
    it('✅ returns 400 when authService.register throws "Email already registered"', async () => {
      authService.register.mockRejectedValue(new Error('Email already registered'));
      const req = { body: VALID_SIGNUP_BODY };
      const res = makeRes();
      await signup(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Email already registered' });
    });

    it('✅ returns 400 when authService.register throws "Username already taken"', async () => {
      authService.register.mockRejectedValue(new Error('Username already taken'));
      const req = { body: VALID_SIGNUP_BODY };
      const res = makeRes();
      await signup(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Username already taken' });
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  signin
// ─────────────────────────────────────────────────────────────────────────────
describe('authController › signin', () => {

  beforeEach(() => vi.clearAllMocks());

  // ── Input validation ─────────────────────────────────────────────────────────
  describe('input validation', () => {
    it('✅ returns 400 when email is missing', async () => {
      const req = { body: { password: 'pass123' } };
      const res = makeRes();
      await signin(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('✅ returns 400 when password is missing', async () => {
      const req = { body: { email: 'rahim@example.com' } };
      const res = makeRes();
      await signin(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('✅ returns 400 when both fields are missing', async () => {
      const req = { body: {} };
      const res = makeRes();
      await signin(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  // ── Success path ─────────────────────────────────────────────────────────────
  describe('success', () => {
    it('✅ returns 200 with user and token on valid credentials', async () => {
      authService.login.mockResolvedValue(AUTH_RESULT);
      const req = { body: { email: 'rahim@example.com', password: 'password123' } };
      const res = makeRes();
      await signin(req, res);
      // res.json without res.status means 200 by default
      expect(res.json).toHaveBeenCalledWith(AUTH_RESULT);
    });

    it('✅ calls authService.login with email and password', async () => {
      authService.login.mockResolvedValue(AUTH_RESULT);
      const req = { body: { email: 'rahim@example.com', password: 'password123' } };
      await signin(req, makeRes());
      expect(authService.login).toHaveBeenCalledWith({
        email: 'rahim@example.com', password: 'password123',
      });
    });
  });

  // ── Service errors ───────────────────────────────────────────────────────────
  describe('service errors', () => {
    it('✅ returns 401 when authService.login throws "Invalid email or password"', async () => {
      authService.login.mockRejectedValue(new Error('Invalid email or password'));
      const req = { body: { email: 'x@x.com', password: 'wrong' } };
      const res = makeRes();
      await signin(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid email or password' });
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  profile
// ─────────────────────────────────────────────────────────────────────────────
describe('authController › profile', () => {

  beforeEach(() => vi.clearAllMocks());

  it('✅ returns the user attached to req.user', async () => {
    const req = { user: AUTH_RESULT.user };
    const res = makeRes();
    await profile(req, res);
    expect(res.json).toHaveBeenCalledWith({ user: AUTH_RESULT.user });
  });

  it('✅ does not call authService for profile', async () => {
    const req = { user: AUTH_RESULT.user };
    await profile(req, makeRes());
    expect(authService.register).not.toHaveBeenCalled();
    expect(authService.login).not.toHaveBeenCalled();
  });
});
