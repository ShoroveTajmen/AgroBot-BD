/**
 * ============================================================
 *  UNIT TESTS — SignUp page
 *
 *  Tests form rendering, client-side validation (password length),
 *  API call, success flow, and error display.
 * ============================================================
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '../../../context/ThemeContext.jsx';

// ── Mock api ──────────────────────────────────────────────────────────────────
vi.mock('../../../services/api.js', () => ({
  default: { post: vi.fn() },
}));

// ── Mock useNavigate ──────────────────────────────────────────────────────────
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

import SignUp from '../../../pages/SignUp.jsx';
import api    from '../../../services/api.js';

function renderSignUp() {
  return render(
    <ThemeProvider>
      <MemoryRouter>
        <SignUp />
      </MemoryRouter>
    </ThemeProvider>
  );
}

// ── Fill the form helper ──────────────────────────────────────────────────────
async function fillForm({ name = 'Rahim Farmer', username = 'rahimfarmer', email = 'rahim@example.com', password = 'password123' } = {}) {
  await userEvent.type(screen.getByPlaceholderText(/enter your full name/i), name);
  await userEvent.type(screen.getByPlaceholderText(/choose a unique username/i), username);
  await userEvent.type(screen.getByPlaceholderText(/example@email\.com/i), email);
  await userEvent.type(screen.getByPlaceholderText(/enter a strong password/i), password);
}

// ─────────────────────────────────────────────────────────────────────────────
//  Rendering
// ─────────────────────────────────────────────────────────────────────────────
describe('SignUp › rendering', () => {

  it('✅ renders the full name input', () => {
    renderSignUp();
    expect(screen.getByPlaceholderText(/enter your full name/i)).toBeDefined();
  });

  it('✅ renders the username input', () => {
    renderSignUp();
    expect(screen.getByPlaceholderText(/choose a unique username/i)).toBeDefined();
  });

  it('✅ renders the email input', () => {
    renderSignUp();
    expect(screen.getByPlaceholderText(/example@email\.com/i)).toBeDefined();
  });

  it('✅ renders the password input', () => {
    renderSignUp();
    expect(screen.getByPlaceholderText(/enter a strong password/i)).toBeDefined();
  });

  it('✅ renders the district dropdown', () => {
    renderSignUp();
    expect(screen.getByText(/select your district/i)).toBeDefined();
  });

  it('✅ renders the Sign Up button', () => {
    renderSignUp();
    expect(screen.getByRole('button', { name: /sign up/i })).toBeDefined();
  });

  it('✅ renders a link to the sign-in page', () => {
    renderSignUp();
    expect(screen.getByText(/sign in/i)).toBeDefined();
  });

  it('✅ district dropdown contains all 8 Bangladesh districts', () => {
    renderSignUp();
    const districts = ['Dhaka', 'Chittagong', 'Rajshahi', 'Khulna', 'Barisal', 'Sylhet', 'Rangpur', 'Mymensingh'];
    districts.forEach(d => {
      expect(screen.getByText(d)).toBeDefined();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  Client-side validation
// ─────────────────────────────────────────────────────────────────────────────
describe('SignUp › client-side validation', () => {

  beforeEach(() => vi.clearAllMocks());

  it('✅ shows error when password is shorter than 6 characters', async () => {
    renderSignUp();
    await fillForm({ password: '12345' });
    await userEvent.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => {
      expect(screen.getByText(/6 characters/i)).toBeDefined();
    });
  });

  it('✅ does NOT call api.post when password is too short', async () => {
    renderSignUp();
    await fillForm({ password: '12345' });
    await userEvent.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => expect(screen.getByText(/6 characters/i)).toBeDefined());
    expect(api.post).not.toHaveBeenCalled();
  });

  it('✅ accepts password of exactly 6 characters', async () => {
    api.post.mockResolvedValue({
      data: { token: 'tok', user: { _id: 'u1', name: 'Rahim', email: 'r@e.com' } },
    });
    renderSignUp();
    await fillForm({ password: '123456' });
    await userEvent.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => expect(api.post).toHaveBeenCalled());
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  Successful sign-up
// ─────────────────────────────────────────────────────────────────────────────
describe('SignUp › successful sign-up', () => {

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    api.post.mockResolvedValue({
      data: {
        token: 'jwt-token-456',
        user:  { _id: 'uid-2', name: 'Rahim Farmer', email: 'rahim@example.com' },
      },
    });
  });

  it('✅ calls api.post with /auth/signup and form data', async () => {
    renderSignUp();
    await fillForm();
    await userEvent.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/auth/signup', expect.objectContaining({
        name: 'Rahim Farmer', username: 'rahimfarmer',
        email: 'rahim@example.com', password: 'password123',
      }));
    });
  });

  it('✅ stores auth_token in localStorage on success', async () => {
    renderSignUp();
    await fillForm();
    await userEvent.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => {
      expect(localStorage.getItem('auth_token')).toBe('jwt-token-456');
    });
  });

  it('✅ stores auth_user in localStorage on success', async () => {
    renderSignUp();
    await fillForm();
    await userEvent.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem('auth_user'));
      expect(stored.name).toBe('Rahim Farmer');
    });
  });

  it('✅ navigates to / on success', async () => {
    renderSignUp();
    await fillForm();
    await userEvent.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  Failed sign-up
// ─────────────────────────────────────────────────────────────────────────────
describe('SignUp › failed sign-up', () => {

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('✅ displays error when email is already registered', async () => {
    api.post.mockRejectedValue({
      response: { data: { error: 'Email already registered' } },
    });

    renderSignUp();
    await fillForm();
    await userEvent.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => {
      expect(screen.getByText(/email already registered/i)).toBeDefined();
    });
  });

  it('✅ displays error when username is already taken', async () => {
    api.post.mockRejectedValue({
      response: { data: { error: 'Username already taken' } },
    });

    renderSignUp();
    await fillForm();
    await userEvent.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => {
      expect(screen.getByText(/username already taken/i)).toBeDefined();
    });
  });

  it('✅ displays fallback error on network failure', async () => {
    api.post.mockRejectedValue(new Error('Network Error'));

    renderSignUp();
    await fillForm();
    await userEvent.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => {
      expect(screen.getByText(/sign up failed/i)).toBeDefined();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  Loading state
// ─────────────────────────────────────────────────────────────────────────────
describe('SignUp › loading state', () => {

  it('✅ button shows "Creating account..." while request is in flight', async () => {
    api.post.mockReturnValue(new Promise(() => {}));

    renderSignUp();
    await fillForm();
    await userEvent.click(screen.getByRole('button', { name: /sign up/i }));

    expect(screen.getByText(/creating account\.\.\./i)).toBeDefined();
  });

  it('✅ button is disabled while loading', async () => {
    api.post.mockReturnValue(new Promise(() => {}));

    renderSignUp();
    await fillForm();
    await userEvent.click(screen.getByRole('button', { name: /sign up/i }));

    expect(screen.getByRole('button', { name: /creating account/i }).disabled).toBe(true);
  });
});
