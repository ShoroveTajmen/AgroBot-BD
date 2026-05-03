/**
 * Test Suite: Sign Up Page
 *
 * Covers:
 * - Page loads correctly
 * - Validation (short password)
 * - Successful registration → redirect to chat
 * - Duplicate email shows error
 * - Navigation link to Sign In
 */

const { test, expect } = require('@playwright/test');
const { TEST_USER, signUp, clearAuth } = require('../fixtures/auth');

// Use a unique user for this suite so tests don't conflict
const timestamp = Date.now();
const user = {
  name: 'Signup Tester',
  username: `signuptester${timestamp}`,
  email: `signuptester${timestamp}@example.com`,
  password: 'Pass1234',
  district: 'dhaka',
};

test.describe('Sign Up Page', () => {

  test('shows the sign up form with all fields', async ({ page }) => {
    await page.goto('/signup');

    // Page title / heading
    await expect(page.getByText('Welcome, Farmer')).toBeVisible();

    // All input fields present
    await expect(page.getByPlaceholder('Enter your full name')).toBeVisible();
    await expect(page.getByPlaceholder('Choose a unique username')).toBeVisible();
    await expect(page.getByPlaceholder('example@email.com')).toBeVisible();
    await expect(page.getByPlaceholder('Enter a strong password')).toBeVisible();

    // District dropdown
    await expect(page.locator('select')).toBeVisible();

    // Submit button
    await expect(page.getByRole('button', { name: /sign up/i })).toBeVisible();

    // Link to sign in
    await expect(page.getByRole('link', { name: /sign in/i })).toBeVisible();
  });

  test('shows error when password is too short (less than 6 chars)', async ({ page }) => {
    await page.goto('/signup');

    await page.getByPlaceholder('Enter your full name').fill('Short Pass User');
    await page.getByPlaceholder('Choose a unique username').fill('shortpassuser');
    await page.getByPlaceholder('example@email.com').fill('short@example.com');
    await page.getByPlaceholder('Enter a strong password').fill('123'); // too short

    await page.getByRole('button', { name: /sign up/i }).click();

    // Should show validation error — stays on signup page
    await expect(page.getByText(/password must be at least 6/i)).toBeVisible();
    await expect(page).toHaveURL(/signup/);
  });

  test('successfully registers a new user and redirects to chat', async ({ page }) => {
    await signUp(page, user);

    // Should be on the chat page now
    await expect(page).toHaveURL('/');

    // Chat header should be visible
    await expect(page.getByText('AgroBot BD')).toBeVisible();
  });

  test('shows error when registering with an already-used email', async ({ page }) => {
    // Try to register the same user again
    await page.goto('/signup');

    await page.getByPlaceholder('Enter your full name').fill(user.name);
    await page.getByPlaceholder('Choose a unique username').fill(`${user.username}_dup`);
    await page.getByPlaceholder('example@email.com').fill(user.email); // same email
    await page.getByPlaceholder('Enter a strong password').fill(user.password);

    await page.getByRole('button', { name: /sign up/i }).click();

    // Wait for the error message text — works in both light and dark mode
    await expect(page.getByText(/email already registered|sign up failed/i)).toBeVisible({ timeout: 10000 });
    await expect(page).toHaveURL(/signup/);
  });

  test('navigates to sign in page when clicking the link', async ({ page }) => {
    await page.goto('/signup');
    await page.getByRole('link', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/signin/);
  });

  test('redirects to chat if already logged in', async ({ page }) => {
    // First sign up to get a token
    await signUp(page, {
      name: 'Already Logged',
      username: `alreadylogged${timestamp}`,
      email: `alreadylogged${timestamp}@example.com`,
      password: 'Pass1234',
    });

    // Now try to visit signup again — should redirect to chat
    await page.goto('/signup');
    await expect(page).toHaveURL('/');
  });

});
