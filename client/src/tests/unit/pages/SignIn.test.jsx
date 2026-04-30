/**
 * ============================================================
 *  UNIT TESTS — SignIn page
 *
 *  Tests form rendering, validation, API call, success flow
 *  (localStorage + navigation), and error display.
 *  The api module and react-router-dom are mocked.
 * ============================================================
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '../../../context/ThemeContext.jsx';

// ── Mock the api module ───────────────────────────────────────────────────────
vi.mock('../../../services/api.js', () => ({
  default: { post: vi.fn() },
}));

// ── Mock react-router-dom's useNavigate ──────────────────────────────────────
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

import SignIn from '../../../pages/SignIn.jsx';
import api    from '../../../services/api.js';

function renderSignIn() {
  return render(
    <ThemeProvider>
      <MemoryRouter>
        <SignIn />
      </MemoryRouter>
    </ThemeProvider>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Rendering
// ─────────────────────────────────────────────────────────────────────────────
describe('SignIn › rendering', () => {

  it('✅ renders the email input', () => {
    renderSignIn();
    expect(screen.getByPlaceholderText(/e\.g\. name@example\.com/i)).toBeDefined();
  });

  it('✅ renders the password input', () => {
    renderSignIn();
    expect(screen.getByPlaceholderText(/••••••••/)).toBeDefined();
  });

  it('✅ renders the Sign In button', () => {
    renderSignIn();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeDefined();
  });

  it('✅ renders a link to the signup page', () => {
    renderSignIn();
    expect(screen.getByText(/register now/i)).toBeDefined();
  });

  it('✅ does not show an error message initially', () => {
    renderSignIn();
    expect(screen.queryByRole('alert')).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  Successful sign-in
// ─────────────────────────────────────────────────────────────────────────────
describe('SignIn › successful sign-in', () => {

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    api.post.mockResolvedValue({
      data: {
        token: 'jwt-token-123',
        user:  { _id: 'uid-1', name: 'Rahim', email: 'rahim@example.com' },
      },
    });
  });

  it('✅ calls api.post with /auth/signin and credentials', async () => {
    renderSignIn();
    await userEvent.type(screen.getByPlaceholderText(/e\.g\. name@example\.com/i), 'rahim@example.com');
    await userEvent.type(screen.getByPlaceholderText(/••••••••/), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/auth/signin', {
        email: 'rahim@example.com', password: 'password123',
      });
    });
  });

  it('✅ stores auth_token in localStorage on success', async () => {
    renderSignIn();
    await userEvent.type(screen.getByPlaceholderText(/e\.g\. name@example\.com/i), 'rahim@example.com');
    await userEvent.type(screen.getByPlaceholderText(/••••••••/), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(localStorage.getItem('auth_token')).toBe('jwt-token-123');
    });
  });

  it('✅ stores auth_user in localStorage on success', async () => {
    renderSignIn();
    await userEvent.type(screen.getByPlaceholderText(/e\.g\. name@example\.com/i), 'rahim@example.com');
    await userEvent.type(screen.getByPlaceholderText(/••••••••/), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem('auth_user'));
      expect(stored.email).toBe('rahim@example.com');
    });
  });

  it('✅ navigates to / on success', async () => {
    renderSignIn();
    await userEvent.type(screen.getByPlaceholderText(/e\.g\. name@example\.com/i), 'rahim@example.com');
    await userEvent.type(screen.getByPlaceholderText(/••••••••/), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  Failed sign-in
// ─────────────────────────────────────────────────────────────────────────────
describe('SignIn › failed sign-in', () => {

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('✅ displays error message when API returns an error', async () => {
    api.post.mockRejectedValue({
      response: { data: { error: 'Invalid email or password' } },
    });

    renderSignIn();
    await userEvent.type(screen.getByPlaceholderText(/e\.g\. name@example\.com/i), 'wrong@example.com');
    await userEvent.type(screen.getByPlaceholderText(/••••••••/), 'wrongpass');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid email or password/i)).toBeDefined();
    });
  });

  it('✅ displays fallback error when API response has no error field', async () => {
    api.post.mockRejectedValue(new Error('Network Error'));

    renderSignIn();
    await userEvent.type(screen.getByPlaceholderText(/e\.g\. name@example\.com/i), 'x@x.com');
    await userEvent.type(screen.getByPlaceholderText(/••••••••/), 'pass123');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/sign in failed/i)).toBeDefined();
    });
  });

  it('✅ does NOT navigate on failure', async () => {
    api.post.mockRejectedValue({ response: { data: { error: 'Invalid email or password' } } });

    renderSignIn();
    await userEvent.type(screen.getByPlaceholderText(/e\.g\. name@example\.com/i), 'x@x.com');
    await userEvent.type(screen.getByPlaceholderText(/••••••••/), 'wrongpass');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => expect(api.post).toHaveBeenCalled());
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  Loading state
// ─────────────────────────────────────────────────────────────────────────────
describe('SignIn › loading state', () => {

  it('✅ button shows "Signing in..." while request is in flight', async () => {
    // Never resolves — keeps loading state active
    api.post.mockReturnValue(new Promise(() => {}));

    renderSignIn();
    await userEvent.type(screen.getByPlaceholderText(/e\.g\. name@example\.com/i), 'x@x.com');
    await userEvent.type(screen.getByPlaceholderText(/••••••••/), 'pass123');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(screen.getByText(/signing in\.\.\./i)).toBeDefined();
  });

  it('✅ button is disabled while loading', async () => {
    api.post.mockReturnValue(new Promise(() => {}));

    renderSignIn();
    await userEvent.type(screen.getByPlaceholderText(/e\.g\. name@example\.com/i), 'x@x.com');
    await userEvent.type(screen.getByPlaceholderText(/••••••••/), 'pass123');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(screen.getByRole('button', { name: /signing in/i }).disabled).toBe(true);
  });
});
