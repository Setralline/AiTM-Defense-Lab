import { test, expect } from '@playwright/test';

/**
 * ------------------------------------------------------------------
 * PHISHING DEFENSE LAB - AUTOMATED UI TESTS
 * ------------------------------------------------------------------
 * These tests verify the accessibility and integrity of all authentication
 * scenarios (Levels 1-5). They act as a "Sanity Check" to ensure the 
 * thesis experiments are reachable and rendering correctly.
 */
test.describe('Phishing Lab UI Navigation & Integrity', () => {

  // Global Setup: Navigate to Mission Control before each test
  test.beforeEach(async ({ page }) => {
    // Ensure your local client is running (Default Vite Port: 5173)
    await page.goto('http://localhost:5173');
  });

  /**
   * Test Case 0: Mission Control (Home)
   * Verifies the landing page loads the correct thesis branding.
   */
  test('Home Page - should display Mission Control', async ({ page }) => {
    await expect(page).toHaveTitle(/Phishing/i);
    await expect(page.getByText('SELECT MISSION')).toBeVisible();
    
    // [UPDATED] Check for the new Admin Panel button instead of the brittle footer text
    await expect(page.getByText('ADMIN PANEL')).toBeVisible(); 
  });

  /**
   * Test Case 1: Level 1 (Legacy Cookies)
   * Target: Vulnerable to Session Hijacking.
   */
  test('Level 1 - should navigate to Legacy Login', async ({ page }) => {
    await page.click('text=LEVEL 1: COOKIES');
    
    await expect(page).toHaveURL(/.*level1/);
    await expect(page.getByText('IDENTITY VERIFICATION')).toBeVisible(); // Check Card Title
    
    // Verify inputs specific to Level 1
    await expect(page.getByPlaceholder('Email')).toBeVisible();
    await expect(page.getByText('Remember terminal')).toBeVisible(); // Checkbox label
  });

  /**
   * Test Case 2: Level 2 (Modern JWT)
   * Target: Vulnerable to Token Theft.
   */
  test('Level 2 - should navigate to Token Auth', async ({ page }) => {
    await page.click('text=LEVEL 2: TOKENS');

    await expect(page).toHaveURL(/.*level2/);
    await expect(page.getByText('TOKEN AUTHENTICATION')).toBeVisible();
    
    // Verify specific JWT UI element
    await expect(page.getByText('Stay Persistent (JWT)')).toBeVisible();
  });

  /**
   * Test Case 3: Level 3 (Header Defense)
   * Target: Server-Side Proxy Detection.
   */
  test('Level 3 - should navigate to Header Analysis', async ({ page }) => {
    await page.click('text=LEVEL 3: HEADER DEFENSE');

    await expect(page).toHaveURL(/.*level3/);
    await expect(page.getByText('HEADER ANALYSIS AUTH')).toBeVisible();
    
    // Button text should indicate analysis state
    await expect(page.getByRole('button', { name: 'SECURE LOGIN' })).toBeVisible();
  });

  /**
   * Test Case 4: Level 4 (Client Defense)
   * Target: DOM-based Domain Guard.
   */
  test('Level 4 - should navigate to Domain Guard', async ({ page }) => {
    await page.click('text=LEVEL 4: CLIENT DEFENSE');

    await expect(page).toHaveURL(/.*level4/);
    await expect(page.getByText('DOMAIN GUARD AUTH')).toBeVisible();
    
    // Verify the Client-Side defense component didn't crash the page on localhost
    await expect(page.getByPlaceholder('Passcode')).toBeVisible();
  });

  /**
   * Test Case 5: Level 5 (FIDO2 / WebAuthn)
   * Target: Phishing Resistant Hardware Auth.
   */
  test('Level 5 - should navigate to FIDO2 Login', async ({ page }) => {
    // Note: The button might have the class 'btn--secure-gold'
    await page.click('text=LEVEL 5: FIDO2');

    await expect(page).toHaveURL(/.*level5/);
    
    // Specific title for Level 5
    await expect(page.getByText('OPERATIVE LOGIN')).toBeVisible();
    
    // Verify "Stay Persistent (1 Year)" specifically for Level 5
    await expect(page.getByText('Stay Persistent (1 Year)')).toBeVisible();
  });

});