/**
 * ============================================================
 *  UNIT TESTS — App.jsx (routing & route guards)
 *
 *  Tests PrivateRoute and PublicRoute guards:
 *    • Unauthenticated users are redirected to /signin
 *    • Authenticated users are redirected away from /signin
 *    • Wildcard routes redirect to /
 * ============================================================
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '../../../context/ThemeContext.jsx';

// ── Lightweight stubs for heavy pages ─────────────────────────────────────────
import { vi } from 'vitest';

vi.mock('../../../pages/Chat.jsx',   () => ({ default: () => <div data-testid="chat-page">Chat</div> }));
vi.mock('../../../pages/SignIn.jsx', () => ({ default: () => <div data-testid="signin-page">SignIn</div> }));
vi.mock('../../../pages/SignUp.jsx', () => ({ default: () => <div data-testid="signup-page">SignUp</div> }));

import App from '../../../App.jsx';

function renderApp(initialPath = '/') {
  return render(
    <ThemeProvider>
      <MemoryRouter initialEntries={[initialPath]}>
        <App />
      </MemoryRouter>
    </ThemeProvider>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  PrivateRoute — unauthenticated
// ─────────────────────────────────────────────────────────────────────────────
describe('App › PrivateRoute (unauthenticated)', () => {

  beforeEach(() => localStorage.clear());

  it('✅ redirects to /signin when no token and visiting /', () => {
    renderApp('/');
    expect(screen.getByTestId('signin-page')).toBeDefined();
  });

  it('✅ does NOT render the Chat page when unauthenticated', () => {
    renderApp('/');
    expect(screen.queryByTestId('chat-page')).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  PrivateRoute — authenticated
// ─────────────────────────────────────────────────────────────────────────────
describe('App › PrivateRoute (authenticated)', () => {

  beforeEach(() => {
    localStorage.setItem('auth_token', 'valid-jwt-token');
  });

  it('✅ renders Chat page when authenticated and visiting /', () => {
    renderApp('/');
    expect(screen.getByTestId('chat-page')).toBeDefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  PublicRoute — unauthenticated
// ─────────────────────────────────────────────────────────────────────────────
describe('App › PublicRoute (unauthenticated)', () => {

  beforeEach(() => localStorage.clear());

  it('✅ renders SignIn page when visiting /signin without a token', () => {
    renderApp('/signin');
    expect(screen.getByTestId('signin-page')).toBeDefined();
  });

  it('✅ renders SignUp page when visiting /signup without a token', () => {
    renderApp('/signup');
    expect(screen.getByTestId('signup-page')).toBeDefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  PublicRoute — authenticated (should redirect away)
// ─────────────────────────────────────────────────────────────────────────────
describe('App › PublicRoute (authenticated)', () => {

  beforeEach(() => {
    localStorage.setItem('auth_token', 'valid-jwt-token');
  });

  it('✅ redirects authenticated user away from /signin to /', () => {
    renderApp('/signin');
    expect(screen.queryByTestId('signin-page')).toBeNull();
    expect(screen.getByTestId('chat-page')).toBeDefined();
  });

  it('✅ redirects authenticated user away from /signup to /', () => {
    renderApp('/signup');
    expect(screen.queryByTestId('signup-page')).toBeNull();
    expect(screen.getByTestId('chat-page')).toBeDefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  Wildcard route
// ─────────────────────────────────────────────────────────────────────────────
describe('App › wildcard route', () => {

  it('✅ redirects unknown paths to / (then to /signin if unauthenticated)', () => {
    localStorage.clear();
    renderApp('/some/unknown/path');
    // Should end up at /signin because unauthenticated
    expect(screen.getByTestId('signin-page')).toBeDefined();
  });

  it('✅ redirects unknown paths to / (then to Chat if authenticated)', () => {
    localStorage.setItem('auth_token', 'valid-jwt-token');
    renderApp('/some/unknown/path');
    expect(screen.getByTestId('chat-page')).toBeDefined();
  });
});
