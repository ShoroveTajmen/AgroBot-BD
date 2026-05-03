/**
 * Shared test helpers for authentication.
 * These helpers are used across multiple test files to avoid repetition.
 */

// A unique test user — timestamp keeps it unique across runs
const timestamp = Date.now();

const TEST_USER = {
  name: 'Test Farmer',
  username: `testfarmer${timestamp}`,
  email: `testfarmer${timestamp}@example.com`,
  password: 'Test1234',
  district: 'dhaka',
};

/**
 * Fill and submit the Sign Up form.
 * @param {import('@playwright/test').Page} page
 * @param {object} user - optional overrides
 */
async function signUp(page, user = TEST_USER) {
  await page.goto('/signup');

  await page.getByPlaceholder('Enter your full name').fill(user.name);
  await page.getByPlaceholder('Choose a unique username').fill(user.username);
  await page.getByPlaceholder('example@email.com').fill(user.email);
  await page.getByPlaceholder('Enter a strong password').fill(user.password);

  // Select district from dropdown
  if (user.district) {
    await page.locator('select').selectOption(user.district);
  }

  await page.getByRole('button', { name: /sign up/i }).click();

  // Wait until redirected to chat page
  await page.waitForURL('/', { timeout: 15000 });
}

/**
 * Fill and submit the Sign In form.
 * @param {import('@playwright/test').Page} page
 * @param {object} credentials
 */
async function signIn(page, credentials = { email: TEST_USER.email, password: TEST_USER.password }) {
  await page.goto('/signin');

  await page.getByPlaceholder('e.g. name@example.com').fill(credentials.email);
  await page.getByPlaceholder('••••••••').fill(credentials.password);

  await page.getByRole('button', { name: /sign in/i }).click();

  // Wait until redirected to chat page
  await page.waitForURL('/', { timeout: 15000 });
}

/**
 * Clear auth tokens from localStorage (simulate logout).
 * @param {import('@playwright/test').Page} page
 */
async function clearAuth(page) {
  await page.evaluate(() => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('agrobot_conversationId');
  });
}

module.exports = { TEST_USER, signUp, signIn, clearAuth };
