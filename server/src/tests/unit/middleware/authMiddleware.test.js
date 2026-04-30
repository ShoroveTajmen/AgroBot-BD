/**
 * ============================================================
 *  UNIT TESTS — authMiddleware (authenticate)
 *
 *  Tests the Express middleware that validates Bearer tokens.
 *  authService is mocked so no real DB or JWT is needed.
 * ============================================================
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock authService ──────────────────────────────────────────────────────────
vi.mock('../../../services/authService.js', () => ({
  authService: {
    verify:   vi.fn(),
    findById: vi.fn(),
  },
}));

import { authenticate }  from '../../../middleware/authMiddleware.js';
import { authService }   from '../../../services/authService.js';

// ─────────────────────────────────────────────────────────────────────────────
//  Helpers — build minimal req / res / next mocks
// ─────────────────────────────────────────────────────────────────────────────
function makeReq(authHeader) {
  return { headers: { authorization: authHeader } };
}

function makeRes() {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json   = vi.fn().mockReturnValue(res);
  return res;
}

const MOCK_USER = { _id: 'user-id-123', name: 'Rahim', email: 'rahim@example.com' };

// ─────────────────────────────────────────────────────────────────────────────
//  authenticate
// ─────────────────────────────────────────────────────────────────────────────
describe('authMiddleware › authenticate', () => {

  beforeEach(() => vi.clearAllMocks());

  // ── Missing / malformed header ───────────────────────────────────────────────
  describe('missing or malformed Authorization header', () => {
    it('✅ returns 401 when Authorization header is absent', async () => {
      const req  = makeReq(undefined);
      const res  = makeRes();
      const next = vi.fn();

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
      expect(next).not.toHaveBeenCalled();
    });

    it('✅ returns 401 when header does not start with "Bearer "', async () => {
      const req  = makeReq('Token abc123');
      const res  = makeRes();
      const next = vi.fn();

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('✅ returns 401 for empty string header', async () => {
      const req  = makeReq('');
      const res  = makeRes();
      const next = vi.fn();

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
  });

  // ── Invalid / expired token ──────────────────────────────────────────────────
  describe('invalid or expired token', () => {
    it('✅ returns 401 when authService.verify throws', async () => {
      authService.verify.mockImplementation(() => { throw new Error('jwt expired'); });

      const req  = makeReq('Bearer bad.token.here');
      const res  = makeRes();
      const next = vi.fn();

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('✅ returns 401 when user is not found in DB', async () => {
      authService.verify.mockReturnValue({ userId: 'ghost-id' });
      authService.findById.mockResolvedValue(null);

      const req  = makeReq('Bearer valid.looking.token');
      const res  = makeRes();
      const next = vi.fn();

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
  });

  // ── Valid token ──────────────────────────────────────────────────────────────
  describe('valid token', () => {
    it('✅ calls next() when token is valid and user exists', async () => {
      authService.verify.mockReturnValue({ userId: MOCK_USER._id });
      authService.findById.mockResolvedValue(MOCK_USER);

      const req  = makeReq('Bearer valid.jwt.token');
      const res  = makeRes();
      const next = vi.fn();

      await authenticate(req, res, next);

      expect(next).toHaveBeenCalledOnce();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('✅ attaches user object to req.user', async () => {
      authService.verify.mockReturnValue({ userId: MOCK_USER._id });
      authService.findById.mockResolvedValue(MOCK_USER);

      const req  = makeReq('Bearer valid.jwt.token');
      const res  = makeRes();
      const next = vi.fn();

      await authenticate(req, res, next);

      expect(req.user).toEqual(MOCK_USER);
    });

    it('✅ strips "Bearer " prefix before calling verify', async () => {
      authService.verify.mockReturnValue({ userId: MOCK_USER._id });
      authService.findById.mockResolvedValue(MOCK_USER);

      await authenticate(makeReq('Bearer my.actual.token'), makeRes(), vi.fn());

      expect(authService.verify).toHaveBeenCalledWith('my.actual.token');
    });

    it('✅ calls findById with the userId from the decoded token', async () => {
      authService.verify.mockReturnValue({ userId: 'specific-user-id' });
      authService.findById.mockResolvedValue(MOCK_USER);

      await authenticate(makeReq('Bearer some.token'), makeRes(), vi.fn());

      expect(authService.findById).toHaveBeenCalledWith('specific-user-id');
    });
  });

  // ── Error message content ────────────────────────────────────────────────────
  describe('error response messages', () => {
    it('✅ 401 response includes an "error" key', async () => {
      const req = makeReq(undefined);
      const res = makeRes();
      await authenticate(req, res, vi.fn());
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
    });

    it('✅ error message is non-empty', async () => {
      const req = makeReq(undefined);
      const res = makeRes();
      await authenticate(req, res, vi.fn());
      const [call] = res.json.mock.calls;
      expect(call[0].error.length).toBeGreaterThan(0);
    });
  });
});
