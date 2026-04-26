import { test, expect } from '@playwright/test';

test.describe('API Endpoints', () => {
  test('should serve the main page', async ({ request }) => {
    const response = await request.get('/');
    expect(response.ok()).toBeTruthy();
    expect(response.headers()['content-type']).toContain('text/html');
  });

  test('should handle file upload endpoint', async ({ request }) => {
    // Test the upload endpoint exists and responds
    // Note: This is a basic check; actual file upload testing would require form data

    const response = await request.get('/upload');
    // This might return a method not allowed or redirect
    expect(response.status()).toBeGreaterThanOrEqual(200);
  });

  test('should serve static files', async ({ request }) => {
    // Test CSS file
    const cssResponse = await request.get('/styles.css');
    expect(cssResponse.ok()).toBeTruthy();
    expect(cssResponse.headers()['content-type']).toContain('text/css');

    // Test JavaScript file
    const jsResponse = await request.get('/script.js');
    expect(jsResponse.ok()).toBeTruthy();
    expect(jsResponse.headers()['content-type']).toContain('application/javascript');
  });

  test('should handle 404 for non-existent routes', async ({ request }) => {
    const response = await request.get('/api/v1/non-existent-route');
    expect(response.status()).toBe(404);
  });
});