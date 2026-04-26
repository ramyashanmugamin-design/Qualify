import { test, expect } from '@playwright/test';

test.describe('Qualify - Skill Assessment Platform', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
  });

  test('should load the main page', async ({ page }) => {
    // Check if the page title is correct
    await expect(page).toHaveTitle(/Qualify/);

    // Check if main elements are present
    await expect(page.locator('h1')).toContainText('Qualify');
  const subtitle = page.getByText('Professional Skill Assessment & Learning Planner');
  await expect(subtitle).toBeVisible();

    // Check if upload sections are present
    await expect(page.locator('.upload-box')).toHaveCount(2);
  });

  test('should show file upload areas', async ({ page }) => {
    // Check job description upload area
    const jobDescSection = page.locator('.upload-box').first();
    await expect(jobDescSection.locator('h3')).toContainText('Job Description');

    // Check resume upload area
    const resumeSection = page.locator('.upload-box').last();
    await expect(resumeSection.locator('h3')).toContainText('Resume');

    // Check for file input labels
    await expect(page.locator('.file-label')).toHaveCount(2);
  });

  test('should validate file upload restrictions', async ({ page }) => {
    const formatNotes = page.locator('.supported-format-note');
    // Check supported formats are displayed
    await expect(formatNotes).toHaveText([
    /Supported formats: PDF, DOC, DOCX, RTF, TXT/,
    /Supported formats: PDF, DOC, DOCX, RTF, TXT/
  ]);
    await expect(formatNotes).toHaveText([
    /Maximum file size: 2 MB/,
    /Maximum file size: 2 MB/
  ]);
  });

  test('should have responsive design', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Check if elements are still accessible
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('.upload-box')).toHaveCount(2);

    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('h1')).toBeVisible();
  });
});