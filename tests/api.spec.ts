import { expect, test } from '@playwright/test';

test('application homepage is reachable', async ({ request }) => {
  const response = await request.get('/');
  expect(response.ok()).toBeTruthy();
});
