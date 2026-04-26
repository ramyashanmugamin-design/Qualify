import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('File Upload and Processing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should upload job description file', async ({ page }) => {
    // Create a test file path
    const testFilePath = path.join(process.cwd(), 'job_description.txt');

    // Upload job description file
    const jobDescInput = page.locator('.upload-box').first().locator('input[type="file"]');
    await jobDescInput.setInputFiles(testFilePath);

    // Check if file is uploaded (this might show a success message or change the UI)
    // The exact behavior depends on the implementation
    await expect(page.locator('#jobDescriptionName')).toContainText('job_description.txt');
  });

  test('should upload resume file', async ({ page }) => {
    // Create a test file path
    const testFilePath = path.join(process.cwd(), 'resume.txt');

    // Upload resume file
    const resumeInput = page.locator('.upload-box').last().locator('input[type="file"]');
    await resumeInput.setInputFiles(testFilePath);

    // Check if file is uploaded
    await expect(page.locator('#resumeName')).toContainText('resume.txt');
  });

  test('should process uploaded files and show results', async ({ page }) => {
    // Upload both files
    const jobDescPath = path.join(process.cwd(), 'job_description.txt');
    const resumePath = path.join(process.cwd(), 'resume.txt');

    await page.locator('.upload-box').first().locator('input[type="file"]').setInputFiles(jobDescPath);
    await page.locator('.upload-box').last().locator('input[type="file"]').setInputFiles(resumePath);

    // Submit the form
    await page.locator('#submitBtn').click();

    // Wait for processing and results
    await page.waitForSelector('#resultsSection', { timeout: 10000 });

    // Check if results section appears
    await expect(page.locator('#resultsSection')).toBeVisible();
  });
  });

  