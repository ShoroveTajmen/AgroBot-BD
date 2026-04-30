/**
 * ============================================================
 *  CLIENT TEST SETUP
 *  Runs before every test file on the client side.
 *  Provides jsdom globals, localStorage mock, and React
 *  Testing Library cleanup.
 * ============================================================
 */

import { vi, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// ── Auto-cleanup React trees after each test ──────────────────────────────────
afterEach(() => {
  cleanup();
});

// ── localStorage mock ─────────────────────────────────────────────────────────
// jsdom provides a real localStorage, but we reset it between tests.
afterEach(() => {
  localStorage.clear();
});

// ── window.location mock ──────────────────────────────────────────────────────
// Prevents "Not implemented: navigation" errors when code does window.location.href = ...
// Use a full URL so axios's isURLSameOrigin helper doesn't fail
Object.defineProperty(window, 'location', {
  writable: true,
  value: { href: 'http://localhost/', assign: vi.fn(), replace: vi.fn() },
});

// ── Silence React Router warnings in test output ──────────────────────────────
vi.spyOn(console, 'warn').mockImplementation((msg) => {
  if (typeof msg === 'string' && msg.includes('React Router')) return;
  // Let other warnings through
});
