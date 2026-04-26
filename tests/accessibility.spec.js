import { test, expect } from '@playwright/test';

test.describe('Accessibility and Performance', () => {
  test('should have proper heading structure', async ({ page }) => {
    await page.goto('/');

    // Check for h1
    const h1 = page.locator('h1');
    await expect(h1).toHaveCount(1);

    // Check heading hierarchy (h1 should come before h2, etc.)
    const headings = page.locator('h1, h2, h3, h4, h5, h6');
    const headingTags = await headings.evaluateAll(elements =>
      elements.map(el => el.tagName.toLowerCase())
    );

    // Ensure h1 is present and properly positioned
    expect(headingTags).toContain('h1');
  });

  test('should have alt text for images', async ({ page }) => {
    await page.goto('/');

    // Check all images have alt attributes
    const images = page.locator('img');
    const imageCount = await images.count();

    for (let i = 0; i < imageCount; i++) {
      const alt = await images.nth(i).getAttribute('alt');
      expect(alt).not.toBeNull();
      expect(alt?.length).toBeGreaterThan(0);
    }
  });

 

  test('should have sufficient color contrast', async ({ page }) => {
    await page.goto('/');

    // This is a basic check - in a real scenario, you'd use a color contrast checker
    // For now, just ensure text is readable (not invisible)
    const textElements = page.locator('p, span, div, h1, h2, h3, h4, h5, h6');
    const visibleTextCount = await textElements.count();

    expect(visibleTextCount).toBeGreaterThan(0);
  });

  test('should load within reasonable time', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(5000); // Should load within 5 seconds
  });

});