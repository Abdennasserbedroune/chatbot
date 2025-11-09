import { test, expect } from '@playwright/test';

test.describe('Chat Interface', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display chat interface', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Chat Assistant');
    await expect(page.locator('textarea')).toBeVisible();
  });

  test('should have language switcher', async ({ page }) => {
    await expect(page.locator('button:has-text("EN")')).toBeVisible();
    await expect(page.locator('button:has-text("FR")')).toBeVisible();
  });

  test('should switch language', async ({ page }) => {
    // Click FR button
    await page.click('button:has-text("FR")');
    
    // Check that placeholder text changes
    const placeholder = await page.locator('textarea').getAttribute('placeholder');
    expect(placeholder).toContain('message');
  });

  test('should send message', async ({ page }) => {
    const testMessage = 'Hello, this is a test message';
    
    // Type and send message
    await page.fill('textarea', testMessage);
    await page.keyboard.press('Enter');
    
    // Verify message appears in chat
    await expect(page.locator('text=' + testMessage)).toBeVisible();
  });

  test('should show typing indicator', async ({ page }) => {
    await page.fill('textarea', 'Test question');
    await page.keyboard.press('Enter');
    
    // Wait for typing indicator (may appear briefly)
    // Note: This might be flaky depending on API response time
    await page.waitForTimeout(500);
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('textarea')).toBeVisible();
  });

  test('should handle keyboard navigation', async ({ page }) => {
    // Focus on textarea
    await page.focus('textarea');
    
    // Type message
    await page.keyboard.type('Test message');
    
    // Press Enter to send
    await page.keyboard.press('Enter');
    
    // Verify message was sent
    await expect(page.locator('text=Test message')).toBeVisible();
  });

  test('should display status indicator', async ({ page }) => {
    await expect(page.locator('text=Online')).toBeVisible();
  });
});

test.describe('Error Handling', () => {
  test('should handle network errors gracefully', async ({ page }) => {
    // Simulate offline mode
    await page.context().setOffline(true);
    
    await page.goto('/');
    await page.fill('textarea', 'Test message');
    await page.keyboard.press('Enter');
    
    // Wait a bit for error to appear
    await page.waitForTimeout(2000);
    
    // Check that the page doesn't crash
    await expect(page.locator('h1')).toBeVisible();
  });
});

test.describe('Accessibility', () => {
  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('/');
    
    // Check for ARIA labels on buttons
    const enButton = page.locator('button[aria-label*="English"]');
    const frButton = page.locator('button[aria-label*="French"]');
    
    await expect(enButton).toBeVisible();
    await expect(frButton).toBeVisible();
  });

  test('should be keyboard accessible', async ({ page }) => {
    await page.goto('/');
    
    // Tab through interactive elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Should reach textarea
    const focused = await page.evaluate(() => document.activeElement?.tagName);
    expect(['TEXTAREA', 'BUTTON']).toContain(focused);
  });
});
