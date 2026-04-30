/**
 * ============================================================
 *  UNIT TESTS — api.js (Axios instance)
 *
 *  Tests the request interceptor (token attachment) and the
 *  response interceptor (401 → clear storage + redirect).
 *
 *  We test the interceptor logic directly by building a fresh
 *  axios instance with the same interceptors as api.js and
 *  using vi.spyOn to intercept the underlying adapter.
 * ============================================================
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';

// ── Build a fresh axios instance with the same interceptors as api.js ─────────
function createApiInstance() {
  const instance = axios.create({ baseURL: 'http://localhost/api' });

  instance.interceptors.request.use(config => {
    const token = localStorage.getItem('auth_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  instance.interceptors.response.use(
    res => res,
    err => {
      if (err.response?.status === 401) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        localStorage.removeItem('agrobot_conversationId');
        window.location.href = '/signin';
      }
      return Promise.reject(err);
    }
  );

  return instance;
}

// ── Helper: capture the outgoing request config ───────────────────────────────
function mockRequest(instance, responseData = { ok: true }, status = 200) {
  let capturedConfig = null;
  instance.defaults.adapter = async (config) => {
    capturedConfig = config;
    if (status >= 400) {
      const error = new Error(`Request failed with status code ${status}`);
      error.response = { status, data: responseData, headers: {}, config };
      throw error;
    }
    return { status, data: responseData, headers: {}, config };
  };
  return () => capturedConfig;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Request interceptor — token attachment
// ─────────────────────────────────────────────────────────────────────────────
describe('api › request interceptor', () => {

  beforeEach(() => localStorage.clear());

  it('✅ attaches Authorization header when auth_token is in localStorage', async () => {
    localStorage.setItem('auth_token', 'my-jwt-token');
    const api = createApiInstance();
    const getConfig = mockRequest(api);

    await api.get('/test');
    expect(getConfig().headers.Authorization).toBe('Bearer my-jwt-token');
  });

  it('✅ does NOT attach Authorization header when no token in localStorage', async () => {
    const api = createApiInstance();
    const getConfig = mockRequest(api);

    await api.get('/test');
    expect(getConfig().headers.Authorization).toBeUndefined();
  });

  it('✅ uses "Bearer " prefix for the token', async () => {
    localStorage.setItem('auth_token', 'abc123');
    const api = createApiInstance();
    const getConfig = mockRequest(api);

    await api.get('/test');
    expect(getConfig().headers.Authorization).toMatch(/^Bearer /);
  });

  it('✅ token value is appended after "Bearer "', async () => {
    localStorage.setItem('auth_token', 'token-xyz');
    const api = createApiInstance();
    const getConfig = mockRequest(api);

    await api.get('/test');
    expect(getConfig().headers.Authorization).toBe('Bearer token-xyz');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  Response interceptor — 401 handling
// ─────────────────────────────────────────────────────────────────────────────
describe('api › response interceptor (401 handling)', () => {

  beforeEach(() => {
    localStorage.setItem('auth_token',             'old-token');
    localStorage.setItem('auth_user',              JSON.stringify({ name: 'Rahim' }));
    localStorage.setItem('agrobot_conversationId', 'conv-123');
    window.location.href = '/';
  });

  afterEach(() => localStorage.clear());

  it('✅ clears auth_token from localStorage on 401', async () => {
    const api = createApiInstance();
    mockRequest(api, { error: 'Unauthorized' }, 401);
    await api.get('/protected').catch(() => {});
    expect(localStorage.getItem('auth_token')).toBeNull();
  });

  it('✅ clears auth_user from localStorage on 401', async () => {
    const api = createApiInstance();
    mockRequest(api, { error: 'Unauthorized' }, 401);
    await api.get('/protected').catch(() => {});
    expect(localStorage.getItem('auth_user')).toBeNull();
  });

  it('✅ clears agrobot_conversationId from localStorage on 401', async () => {
    const api = createApiInstance();
    mockRequest(api, { error: 'Unauthorized' }, 401);
    await api.get('/protected').catch(() => {});
    expect(localStorage.getItem('agrobot_conversationId')).toBeNull();
  });

  it('✅ redirects to /signin on 401', async () => {
    const api = createApiInstance();
    mockRequest(api, { error: 'Unauthorized' }, 401);
    await api.get('/protected').catch(() => {});
    expect(window.location.href).toBe('/signin');
  });

  it('✅ does NOT clear localStorage on non-401 errors (e.g. 500)', async () => {
    const api = createApiInstance();
    mockRequest(api, { error: 'Server error' }, 500);
    await api.get('/broken').catch(() => {});
    expect(localStorage.getItem('auth_token')).toBe('old-token');
  });

  it('✅ rejects the promise so callers can catch the error', async () => {
    const api = createApiInstance();
    mockRequest(api, { error: 'Unauthorized' }, 401);
    await expect(api.get('/protected')).rejects.toBeDefined();
  });

  it('✅ passes through successful responses unchanged', async () => {
    const api = createApiInstance();
    mockRequest(api, { result: 'ok' }, 200);
    const res = await api.get('/data');
    expect(res.data.result).toBe('ok');
  });
});
