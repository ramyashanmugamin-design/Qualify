// test-utils.js
import path from 'path';

/**
 * Upload test files for job description and resume
 * @param {Page} page - Playwright page object
 */
export async function uploadTestFiles(page) {
  const jobDescPath = path.join(process.cwd(), 'job_description.txt');
  const resumePath = path.join(process.cwd(), 'resume.txt');

  // Upload job description
  const jobDescInput = page.locator('.upload-box').first().locator('input[type="file"]');
  await jobDescInput.setInputFiles(jobDescPath);

  // Upload resume
  const resumeInput = page.locator('.upload-box').last().locator('input[type="file"]');
  await resumeInput.setInputFiles(resumePath);

  // Wait for processing
  await page.waitForTimeout(2000);
}

/**
 * Mock uploaded data for testing
 * @param {Page} page - Playwright page object
 * @param {Object} data - Mock data to set
 */
export async function mockUploadedData(page, data = null) {
  const defaultData = {
    requiredSkills: ['JavaScript', 'Python', 'React', 'Node.js'],
    candidateSkills: [
      { name: 'JavaScript', category: 'Language' },
      { name: 'HTML', category: 'Web' },
      { name: 'CSS', category: 'Web' }
    ]
  };

  await page.evaluate((mockData) => {
    window.uploadedData = mockData;
  }, data || defaultData);
}

/**
 * Wait for element to be visible with timeout
 * @param {Locator} locator - Playwright locator
 * @param {number} timeout - Timeout in milliseconds
 */
export async function waitForVisible(locator, timeout = 5000) {
  try {
    await locator.waitFor({ state: 'visible', timeout });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Check if page is responsive at different viewports
 * @param {Page} page - Playwright page object
 */
export async function testResponsiveness(page) {
  const viewports = [
    { width: 375, height: 667, name: 'Mobile' },
    { width: 768, height: 1024, name: 'Tablet' },
    { width: 1024, height: 768, name: 'Desktop' },
    { width: 1920, height: 1080, name: 'Large Desktop' }
  ];

  for (const viewport of viewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });

    // Check critical elements are visible
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('.upload-box')).toHaveCount(2);
  }
}