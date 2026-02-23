import { expect, test } from '@playwright/test';

test('locked out user sees error message', async ({ page }) => {
  await page.goto('/');
  await page.getByPlaceholder('Username').fill('locked_out_user');
  await page.getByPlaceholder('Password').fill('secret_sauce');
  await page.getByRole('button', { name: 'Login' }).click();

  await expect(page.getByText('Sorry, this user has been locked out.')).toBeVisible();
});
