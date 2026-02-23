import { expect, test, type TestInfo } from '@playwright/test';
import { getFailureHelp } from '../utils/llmFailureExplainer';

async function attachFailureHelp(testInfo: TestInfo): Promise<void> {
  if (testInfo.status === testInfo.expectedStatus) {
    return;
  }

  const help = await getFailureHelp({
    suite: 'Login checks',
    testTitle: testInfo.title,
    file: testInfo.file,
    errorMessage: testInfo.error?.message ?? 'No error message captured',
    stack: testInfo.error?.stack,
  });

  await testInfo.attach('failure-help.txt', {
    body: help,
    contentType: 'text/plain',
  });

  console.log(`\nFailure help for: ${testInfo.title}\n${help}\n`);
}

test.describe('Login flow', () => {
  test.afterEach(async ({}, testInfo) => {
    await attachFailureHelp(testInfo);
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('valid user can login with standard_user', async ({ page }) => {
    await page.getByTestId('username').fill('standard_user');
    await page.getByTestId('password').fill('secret_sauce');
    await page.getByTestId('login-button').click();

    await expect(page).toHaveURL(/inventory\.html/);
    await expect(page.getByText('Products')).toBeVisible();
  });

  test('problem_user can also login successfully', async ({ page }) => {
    await page.getByTestId('username').fill('problem_user');
    await page.getByTestId('password').fill('secret_sauce');
    await page.getByTestId('login-button').click();

    await expect(page).toHaveURL(/inventory\.html/);
    await expect(page.getByText('Products')).toBeVisible();
  });

  test('shows error for invalid password', async ({ page }) => {
    await page.getByTestId('username').fill('standard_user');
    await page.getByTestId('password').fill('wrong_password');
    await page.getByTestId('login-button').click();

    await expect(page.getByTestId('error')).toContainText('Username and password do not match any user');
    await expect(page).toHaveURL('/');
  });

  test('blocks locked_out_user with correct password', async ({ page }) => {
    await page.getByTestId('username').fill('locked_out_user');
    await page.getByTestId('password').fill('secret_sauce');
    await page.getByTestId('login-button').click();

    await expect(page.getByTestId('error')).toContainText('Sorry, this user has been locked out.');
  });

  test('shows required validation when both fields are empty', async ({ page }) => {
    await page.getByTestId('login-button').click();

    await expect(page.getByTestId('error')).toContainText('Username is required');
  });

  test('shows required validation when password is missing', async ({ page }) => {
    await page.getByTestId('username').fill('standard_user');
    await page.getByTestId('login-button').click();

    await expect(page.getByTestId('error')).toContainText('Password is required');
  });
});
