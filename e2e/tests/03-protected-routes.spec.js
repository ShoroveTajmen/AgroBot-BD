/**
 * Test Suite: Protected Routes & Navigation Guards
 *
 * Covers:
 * - Unauthenticated users are redirected to /signin
 * - Authenticated users can access the chat page
 * - Logout clears token and redirects to /signin
 * - Unknown routes redirect to chat (or signin if not logged in)
 */

const { test, expect } = require('@playwright/test');
const { signUp, signIn, clearAuth } = require('../fixtures/auth');

const timestamp = Date.now();
const routeUser = {
  name: 'Route Tester',
  username: `routetester${timestamp}`,
  email: `routetester${timestamp}@example.com`,
  password: 'Pass1234',
};

test.describe('Protected Routes', () => {

  // Register once
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await signUp(page, routeUser);
    await page.close();
  });

  test('unauthenticated user visiting / is redirected to /signin', async ({ page }) => {
    // Make sure no token exists
    await page.goto('/signin');
    await clearAuth(page);

    await page.goto('/');
    await expect(page).toHaveURL(/signin/);
  });

  test('unauthenticated user visiting unknown route is redirected to /signin', async ({ page }) => {
    await page.goto('/signin');
    await clearAuth(page);

    await page.goto('/some-unknown-page');
    await expect(page).toHaveURL(/signin/);
  });

  test('authenticated user can access the chat page', async ({ page }) => {
    await signIn(page, { email: routeUser.email, password: routeUser.password });

    await expect(page).toHaveURL('/');
    await expect(page.getByText('AgroBot BD')).toBeVisible();
  });

  test('logout clears token and redirects to sign in', async ({ page }) => {
    await signIn(page, { email: routeUser.email, password: routeUser.password });

    // Open the user dropdown
    await page.locator('button img[alt="profile"]').click();

    // Click logout
    await page.getByRole('button', { name: /logout/i }).click();

    // Should be on signin page
    await expect(page).toHaveURL(/signin/);

    // Token should be gone
    const token = await page.evaluate(() => localStorage.getItem('auth_token'));
    expect(token).toBeNull();
  });

  test('after logout, visiting / redirects to /signin', async ({ page }) => {
    await signIn(page, { email: routeUser.email, password: routeUser.password });

    // Logout via localStorage clear (simulates token removal)
    await clearAuth(page);

    await page.goto('/');
    await expect(page).toHaveURL(/signin/);
  });

});
