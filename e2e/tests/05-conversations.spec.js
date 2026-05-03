/**
 * Test Suite: Conversation Management
 *
 * Covers:
 * - New conversation is created after first message
 * - Conversation appears in sidebar history
 * - Clicking a conversation in sidebar loads it
 * - "Start New Consult" starts a fresh chat
 * - Deleting a conversation removes it from the list
 */

const { test, expect } = require('@playwright/test');
const { signUp, signIn } = require('../fixtures/auth');

const timestamp = Date.now();
const convUser = {
  name: 'Conv Tester',
  username: `convtester${timestamp}`,
  email: `convtester${timestamp}@example.com`,
  password: 'Pass1234',
  district: 'rajshahi',
};

test.describe('Conversation Management', () => {

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await signUp(page, convUser);
    await page.close();
  });

  test.beforeEach(async ({ page }) => {
    await signIn(page, { email: convUser.email, password: convUser.password });
    await expect(page).toHaveURL('/');
  });

  test('sending a message creates a new conversation', async ({ page }) => {
    const input = page.getByPlaceholder('Type your question...');
    await input.fill('Tell me about wheat diseases');
    await page.locator('button:has-text("➤")').click();

    // Wait for bot response (conversation is saved after response)
    await expect(page.getByText('Tell me about wheat diseases')).toBeVisible();

    // Open sidebar and check conversation appears
    await page.locator('header button').first().click();
    await expect(page.getByText('Conversation History')).toBeVisible();

    // At least one conversation should be listed
    await expect(page.locator('.flex-1.overflow-y-auto .cursor-pointer').first())
      .toBeVisible({ timeout: 15000 });
  });

  test('"Start New Consult" button clears the chat', async ({ page }) => {
    // First send a message to have something in chat
    const input = page.getByPlaceholder('Type your question...');
    await input.fill('First message');
    await page.locator('button:has-text("➤")').click();
    await expect(page.getByText('First message')).toBeVisible();

    // Open sidebar and click Start New Consult
    await page.locator('header button').first().click();
    await page.getByRole('button', { name: /start new consult/i }).click();

    // Sidebar should close and chat should show welcome message
    await expect(page.getByText('Conversation History')).not.toBeVisible();
    await expect(page.getByText(/hello|assalamu|agrobot/i).first()).toBeVisible();
  });

  test('conversation title appears in sidebar after sending a message', async ({ page }) => {
    const messageText = 'How to grow tomatoes in Bangladesh';

    const input = page.getByPlaceholder('Type your question...');
    await input.fill(messageText);
    await page.locator('button:has-text("➤")').click();

    // Wait for message to appear
    await expect(page.getByText(messageText)).toBeVisible();

    // Open sidebar
    await page.locator('header button').first().click();

    // The conversation title should contain the message text (truncated)
    await expect(page.getByText(/how to grow tomatoes/i).first())
      .toBeVisible({ timeout: 15000 });
  });

  test('can delete a conversation from the sidebar', async ({ page }) => {
    // Send a message to create a conversation
    const input = page.getByPlaceholder('Type your question...');
    await input.fill('Message to delete later');
    await page.locator('button:has-text("➤")').click();

    // Wait for the user message to appear
    await expect(page.getByText('Message to delete later')).toBeVisible();

    // Wait for the bot to respond — conversation is only saved to DB after bot replies
    // This ensures the conversation exists in the sidebar when we open it
    await page.waitForTimeout(3000);

    // Open sidebar and wait for conversations to load
    await page.locator('header button').first().click();
    await expect(page.getByText('Conversation History')).toBeVisible();

    // Wait until at least one conversation appears
    const convList = page.locator('.flex-1.overflow-y-auto .cursor-pointer');
    await expect(convList.first()).toBeVisible({ timeout: 10000 });

    const convsBefore = await convList.count();

    // Register dialog handler BEFORE clicking delete
    page.once('dialog', dialog => dialog.accept());

    // Click the delete button on the first conversation
    await page.locator('button:has-text("🗑️")').first().click();

    // Wait for the list to update
    await page.waitForTimeout(2000);

    // Should have fewer conversations now (or show "No conversations yet")
    const convsAfter = await convList.count();
    expect(convsAfter).toBeLessThan(convsBefore);
  });

});
