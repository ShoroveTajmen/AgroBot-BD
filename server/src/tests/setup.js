/**
 * ============================================================
 *  SERVER TEST SETUP
 *  Runs before every test file on the server side.
 *  Sets up environment variables and global mocks so tests
 *  never need a real MongoDB, OpenAI, or JWT secret.
 * ============================================================
 */

import { vi } from 'vitest';

// ── Environment variables ─────────────────────────────────────────────────────
process.env.JWT_SECRET      = 'test-jwt-secret-for-unit-tests';
process.env.JWT_EXPIRY      = '7d';
process.env.OPENAI_API_KEY  = 'sk-test-fake-key';
process.env.MONGODB_URI     = 'mongodb://localhost:27017/agrobot-test';
process.env.NODE_ENV        = 'test';

// ── Silence console noise during tests ───────────────────────────────────────
// Comment these out if you want to see server logs while debugging.
vi.spyOn(console, 'log').mockImplementation(() => {});
vi.spyOn(console, 'warn').mockImplementation(() => {});
vi.spyOn(console, 'error').mockImplementation(() => {});
