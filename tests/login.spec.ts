import { expect, test } from '@playwright/test';

test('user can log in with valid credentials', async ({ page }) => {
  await page.goto('/');
  await page.getByPlaceholder('Username').fill('standard_user');
  await page.getByPlaceholder('Password').fill('secret_sauce');
  await page.getByRole('button', { name: 'Login' }).click();

  await expect(page).toHaveURL(/inventory.html/);
  await expect(page.getByText('Products')).toBeVisible();
});
