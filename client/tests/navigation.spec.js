import { test, expect } from '@playwright/test';

/**
 * Frontend Navigation & Integrity Tests
 * These tests act as an automated "Sanity Check" for the Client UI.
 * They verify that the critical attack surfaces (Level 1 & Level 2) are reachable 
 * and render the correct login forms for the thesis experiments.
 */
test.describe('Phishing Lab UI Navigation', () => {

  // Global Setup: Go to the landing page before each specific test
  test.beforeEach(async ({ page }) => {
    // Ensure your local client is running on port 5173 (Vite default)
    await page.goto('http://localhost:5173');
  });

  /**
   * Test Case 1: Landing Page Integrity
   * Ensures the system is online and displays the correct thesis branding.
   */
  test('Home Page - should display correct thesis branding', async ({ page }) => {
    // Check for the browser tab title
    await expect(page).toHaveTitle(/Phishing/);
    
    // Check for the main card title
    // "SELECT MISSION" is the title in your Home.jsx Card
    await expect(page.getByText('SELECT MISSION')).toBeVisible();
  });

  /**
   * Test Case 2: Level 1 (Legacy Auth) Accessibility
   * Verifies that the "Legacy/Cookies" environment is accessible.
   */
  test('Navigation - should navigate to Level 1 (Cookies)', async ({ page }) => {
    // Click the button that contains the text "Level 1"
    await page.click('text=LEVEL 1: COOKIES');

    // Verify the URL changes to /level1
    await expect(page).toHaveURL(/.*level1/);

    // Verify the Login Form appears (Check for "Identity Verification" title)
    await expect(page.getByText('IDENTITY VERIFICATION')).toBeVisible();

    // Verify input fields exist (Email & Password)
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
  });

  /**
   * Test Case 3: Level 2 (Modern Auth) Accessibility
   * Verifies that the "Modern/JWT" environment is accessible.
   */
  test('Navigation - should navigate to Level 2 (Tokens)', async ({ page }) => {
    // Click the button that contains the text "Level 2"
    await page.click('text=LEVEL 2: TOKENS');

    // Verify the URL changes to /level2
    await expect(page).toHaveURL(/.*level2/);

    // Verify the Login Form appears (Check for "Token Authentication" title)
    await expect(page.getByText('TOKEN AUTHENTICATION')).toBeVisible();

    // Verify the unique "Stay Persistent (JWT)" checkbox exists
    // We search for the label text specifically
    await expect(page.getByText('Stay Persistent (JWT)')).toBeVisible();
  });

});