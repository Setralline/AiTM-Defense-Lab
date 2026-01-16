import { test, expect } from '@playwright/test';

test('Home page has correct title', async ({ page }) => {
    await page.goto('http://localhost:5173');

    await expect(page).toHaveTitle(/Phishing/);
});