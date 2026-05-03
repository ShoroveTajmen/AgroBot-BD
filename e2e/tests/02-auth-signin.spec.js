/**
 * Test Suite: Sign In Page
 *
 * Covers:
 * - Page loads correctly
 * - Wrong credentials show error
 * - Successful login → redirect to chat
 * - Token stored in localStorage
 * - Navigation link to Sign Up
 * - Redirect to chat if already logged in
 */

const { test, expect } = require('@playwright/test');
const { signUp, signIn, clearAuth } = require('../fixtures/auth');

// Create a dedicated user for sign-in tests
const timestamp = Date.now();
const signinUser = {
  name: 'Signin Tester',
  username: `signintester${timestamp}`,
  email: `signintester${timestamp}@example.com`,
  password: 'Pass1234',
  district: 'chittagong',
};

test.describe('Sign In Page', () => {

  // Register the user once before all sign-in tests
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await signUp(page, signinUser);
    await page.close();
  });

  test('shows the sign in form', async ({ page }) => {
    await page.goto('/signin');

    // Heading
    await expect(page.getByText('Welcome Back')).toBeVisible();

    // Input fields
    await expect(page.getByPlaceholder('e.g. name@example.com')).toBeVisible();
    await expect(page.getByPlaceholder('••••••••')).toBeVisible();

    // Submit button
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();

    // Link to register
    await expect(page.getByRole('link', { name: /register now/i })).toBeVisible();
  });

  test('shows error with wrong password', async ({ page }) => {
    // Set up route mock BEFORE navigating so it's ready when the form submits.
    // Use status 400 (not 401) — a 401 triggers the api.js interceptor which
    // does window.location.href = '/signin' (full reload), wiping the error state.
    await page.route('**/auth/signin', route => {
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Invalid email or password' }),
      });
    });

    await page.goto('/signin');
    await page.getByPlaceholder('e.g. name@example.com').fill('test@example.com');
    await page.getByPlaceholder('••••••••').fill('wrongpassword');
    await page.getByRole('button', { name: /sign in/i }).click();

    // Error message should appear in the red box
    await expect(page.getByText('Invalid email or password')).toBeVisible({ timeout: 10000 });
    await expect(page).toHaveURL(/signin/);
  });

  test('shows error with non-existent email', async ({ page }) => {
    // Same approach — mock before navigate, use 400 not 401
    await page.route('**/auth/signin', route => {
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Invalid email or password' }),
      });
    });

    await page.goto('/signin');
    await page.getByPlaceholder('e.g. name@example.com').fill('nobody@nowhere.com');
    await page.getByPlaceholder('••••••••').fill('Pass1234');
    await page.getByRole('button', { name: /sign in/i }).click();

    // Error message should appear in the red box
    await expect(page.getByText('Invalid email or password')).toBeVisible({ timeout: 10000 });
    await expect(page).toHaveURL(/signin/);
  });

  test('successfully signs in and redirects to chat', async ({ page }) => {
    await signIn(page, { email: signinUser.email, password: signinUser.password });

    // Should land on chat page
    await expect(page).toHaveURL('/');
    await expect(page.getByText('AgroBot BD')).toBeVisible();
  });

  test('stores auth token in localStorage after sign in', async ({ page }) => {
    await signIn(page, { email: signinUser.email, password: signinUser.password });

    // Check localStorage has the token
    const token = await page.evaluate(() => localStorage.getItem('auth_token'));
    expect(token).toBeTruthy();
    expect(token.length).toBeGreaterThan(10);
  });

  test('navigates to sign up page when clicking the link', async ({ page }) => {
    await page.goto('/signin');
    await page.getByRole('link', { name: /register now/i }).click();
    await expect(page).toHaveURL(/signup/);
  });

  test('redirects to chat if already logged in', async ({ page }) => {
    // Sign in first
    await signIn(page, { email: signinUser.email, password: signinUser.password });

    // Try to visit signin again — should redirect to chat
    await page.goto('/signin');
    await expect(page).toHaveURL('/');
  });

  test('shows password toggle button', async ({ page }) => {
    await page.goto('/signin');

    const passwordInput = page.getByPlaceholder('••••••••');
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // Click the eye toggle
    await page.getByRole('button', { name: /👁|🙈/ }).click();
    await expect(passwordInput).toHaveAttribute('type', 'text');
  });

});
