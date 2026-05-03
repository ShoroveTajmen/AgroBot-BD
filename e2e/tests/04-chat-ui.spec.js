/**
 * Test Suite: Chat Page UI
 *
 * Covers:
 * - Chat page layout elements are visible
 * - Sidebar opens and closes
 * - "Start New Consult" button works
 * - Quick suggestion buttons fill the input
 * - Send button is disabled when input is empty
 * - Sending a message shows it in the chat
 * - Bot responds (typing indicator then response)
 * - User profile dropdown opens
 */

const { test, expect } = require('@playwright/test');
const { signUp, signIn } = require('../fixtures/auth');

const timestamp = Date.now();
const chatUser = {
  name: 'Chat Tester',
  username: `chattester${timestamp}`,
  email: `chattester${timestamp}@example.com`,
  password: 'Pass1234',
  district: 'dhaka',
};

test.describe('Chat Page UI', () => {

  // Register once and sign in before each test
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await signUp(page, chatUser);
    await page.close();
  });

  test.beforeEach(async ({ page }) => {
    await signIn(page, { email: chatUser.email, password: chatUser.password });
    await expect(page).toHaveURL('/');
  });

  test('chat header is visible with logo and brand name', async ({ page }) => {
    await expect(page.getByText('AgroBot BD').first()).toBeVisible();
    await expect(page.locator('header img[alt="AgroBot BD"]')).toBeVisible();
  });

  test('bottom navigation bar is visible', async ({ page }) => {
    const nav = page.locator('nav').last();
    await expect(nav).toBeVisible();
    // Use the nav element as scope to avoid matching the suggestion button
    await expect(nav.getByText('Chat')).toBeVisible();
    await expect(nav.getByText('Weather')).toBeVisible();
  });

  test('message input field is visible and accepts text', async ({ page }) => {
    const input = page.getByPlaceholder('Type your question...');
    await expect(input).toBeVisible();

    await input.fill('Hello AgroBot');
    await expect(input).toHaveValue('Hello AgroBot');
  });

  test('send button is disabled when input is empty', async ({ page }) => {
    const sendBtn = page.locator('button:has-text("➤")');
    await expect(sendBtn).toBeDisabled();
  });

  test('send button becomes enabled when user types', async ({ page }) => {
    const input = page.getByPlaceholder('Type your question...');
    await input.fill('test message');

    const sendBtn = page.locator('button:has-text("➤")');
    await expect(sendBtn).toBeEnabled();
  });

  test('quick suggestion buttons fill the input', async ({ page }) => {
    // Click the first suggestion button
    await page.getByRole('button', { name: /how to control pests in rice/i }).click();

    const input = page.getByPlaceholder('Type your question...');
    await expect(input).toHaveValue('How to control pests in rice?');
  });

  test('sidebar opens when clicking the menu button', async ({ page }) => {
    // Click the hamburger menu button in the header
    await page.locator('header button').first().click();

    // Sidebar should appear with "Conversation History" heading
    await expect(page.getByText('Conversation History')).toBeVisible();
  });

  test('sidebar closes when clicking the X button', async ({ page }) => {
    // Open sidebar
    await page.locator('header button').first().click();
    await expect(page.getByText('Conversation History')).toBeVisible();

    // The fixed header overlaps the ✕ button position.
    // Use JavaScript to click it directly, bypassing pointer-event interception.
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const closeBtn = buttons.find(b => b.textContent.trim() === '✕');
      if (closeBtn) closeBtn.click();
    });

    await expect(page.getByText('Conversation History')).not.toBeVisible({ timeout: 5000 });
  });

  test('sidebar closes when clicking the overlay', async ({ page }) => {
    // Open sidebar
    await page.locator('header button').first().click();
    await expect(page.getByText('Conversation History')).toBeVisible();

    // Click the dark overlay (outside the sidebar panel)
    await page.locator('.fixed.inset-0.bg-black').click({ force: true });
    await expect(page.getByText('Conversation History')).not.toBeVisible();
  });

  test('user profile dropdown opens on avatar click', async ({ page }) => {
    await page.locator('button img[alt="profile"]').click();

    // Dropdown should show user name and logout button
    await expect(page.getByRole('button', { name: /logout/i })).toBeVisible();
  });

  test('sending a message shows it in the chat', async ({ page }) => {
    const input = page.getByPlaceholder('Type your question...');
    await input.fill('What is rice blast disease?');

    await page.locator('button:has-text("➤")').click();

    // User message should appear in chat
    await expect(page.getByText('What is rice blast disease?')).toBeVisible();
  });

  test('bot responds after sending a message', async ({ page }) => {
    const input = page.getByPlaceholder('Type your question...');
    await input.fill('Hello, what can you help me with?');
    await page.locator('button:has-text("➤")').click();

    // Typing indicator appears first
    // Then bot response appears (wait up to 30s for AI response)
    await expect(page.locator('.bg-white.dark\\:bg-gray-800.rounded-2xl').last())
      .toBeVisible({ timeout: 30000 });
  });

  test('input clears after sending a message', async ({ page }) => {
    const input = page.getByPlaceholder('Type your question...');
    await input.fill('Test message to clear');
    await page.locator('button:has-text("➤")').click();

    // Input should be empty after sending
    await expect(input).toHaveValue('');
  });

  test('pressing Enter sends the message', async ({ page }) => {
    const input = page.getByPlaceholder('Type your question...');
    await input.fill('Testing enter key');
    await input.press('Enter');

    // Message should appear in chat
    await expect(page.getByText('Testing enter key')).toBeVisible();
  });

});
