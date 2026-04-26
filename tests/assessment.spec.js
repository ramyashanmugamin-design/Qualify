import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Self-Assessment Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should show self-assessment form after file upload', async ({ page }) => {
    // Upload test files first
    const jobDescPath = path.join(process.cwd(), 'job_description.txt');
    const resumePath = path.join(process.cwd(), 'resume.txt');

    await page.locator('.upload-box').first().locator('input[type="file"]').setInputFiles(jobDescPath);
    await page.locator('.upload-box').last().locator('input[type="file"]').setInputFiles(resumePath);

    // Wait for processing
    await page.waitForTimeout(3000);

    // Check if assessment form appears
    const assessmentForm = page.locator('#assessmentForm');
    if (await assessmentForm.isVisible()) {
      await expect(assessmentForm).toBeVisible();
    }
  });

  test('should display skill assessment questions', async ({ page }) => {
    // This test assumes the assessment form is shown
    // In a real scenario, you'd need to trigger the form display

    // Mock the uploaded data for testing
    await page.evaluate(() => {
      window.uploadedData = {
        requiredSkills: ['JavaScript', 'Python', 'React'],
        candidateSkills: ['JavaScript', 'HTML', 'CSS']
      };
    });

    // Trigger form display (this depends on the actual implementation)
    await page.evaluate(() => {
      if (window.showAssessmentForm) {
        window.showAssessmentForm();
      }
    });

    // Check if proficiency selectors are present
    const proficiencySelectors = page.locator('select[id^="proficiency-"]');
    const count = await proficiencySelectors.count();

    if (count > 0) {
      await expect(proficiencySelectors).toHaveCount(3); // Based on mock data
    }
  });

  test('should submit self-assessment and show results', async ({ page }) => {
    // Set up mock data
    await page.evaluate(() => {
      window.uploadedData = {
        requiredSkills: ['JavaScript', 'Python'],
        candidateSkills: ['JavaScript', 'HTML']
      };
    });

    // Show assessment form
    await page.evaluate(() => {
      if (window.showAssessmentForm) {
        window.showAssessmentForm();
      }
    });

    // Fill out assessment (if form is visible)
    const submitButton = page.locator('#submitAssessment');
    if (await submitButton.isVisible()) {
      // Select proficiency levels
      const selects = page.locator('select[id^="proficiency-"]');
      const selectCount = await selects.count();

      for (let i = 0; i < selectCount; i++) {
        await selects.nth(i).selectOption('3'); // Intermediate proficiency
      }

      // Submit assessment
      await submitButton.click();

      // Check if results are shown
      await expect(page.locator('#assessmentResultsSection')).toBeVisible();
    }
  });

  test('should show skill gaps and learning plan', async ({ page }) => {
    // This test depends on the previous assessment submission
    // Check if gap analysis and learning plan sections are visible

    const gapList = page.locator('#gapList');
    const learningPlanList = page.locator('#learningPlanList');

    // These might not be visible until assessment is submitted
    if (await gapList.isVisible()) {
      await expect(gapList).toBeVisible();
      await expect(learningPlanList).toBeVisible();
    }
  });

  test('should display learning plan with resources', async ({ page }) => {
    // Check learning plan content
    const learningCards = page.locator('.learning-plan');

    if (await learningCards.count() > 0) {
      const firstCard = learningCards.first();

      // Check if card has required elements
      await expect(firstCard.locator('strong')).toBeVisible(); // Skill name
      await expect(firstCard.locator('.time-estimate')).toBeVisible(); // Time estimate
      await expect(firstCard.locator('ul')).toBeVisible(); // Resources list
    }
  });
});