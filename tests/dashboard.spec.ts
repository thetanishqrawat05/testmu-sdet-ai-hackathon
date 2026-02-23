import { expect, test, type Page, type TestInfo } from '@playwright/test';
import { getFailureHelp } from '../utils/llmFailureExplainer';

async function loginAsStandardUser(page: Page): Promise<void> {
  await page.goto('/');
  await page.getByTestId('username').fill('standard_user');
  await page.getByTestId('password').fill('secret_sauce');
  await page.getByTestId('login-button').click();
  await expect(page).toHaveURL(/inventory\.html/);
}

async function attachFailureHelp(testInfo: TestInfo): Promise<void> {
  if (testInfo.status === testInfo.expectedStatus) {
    return;
  }

  const help = await getFailureHelp({
    suite: 'Dashboard checks',
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

test.describe('Dashboard and cart behavior', () => {
  test.afterEach(async ({}, testInfo) => {
    await attachFailureHelp(testInfo);
  });

  test.beforeEach(async ({ page }) => {
    await loginAsStandardUser(page);
  });

  test('shows all inventory items for logged in user', async ({ page }) => {
    const inventoryItems = page.locator('.inventory_item');

    await expect(page.getByText('Products')).toBeVisible();
    await expect(inventoryItems).toHaveCount(6);
  });

  test('sorts products by name Z to A', async ({ page }) => {
    await page.getByTestId('product-sort-container').selectOption('za');

    const firstItemName = await page.locator('.inventory_item_name').first().textContent();
    expect((firstItemName ?? '').trim()).toBe('Test.allTheThings() T-Shirt (Red)');
  });

  test('sorts products by price low to high', async ({ page }) => {
    await page.getByTestId('product-sort-container').selectOption('lohi');

    const prices = await page.locator('.inventory_item_price').allTextContents();
    const numericPrices = prices.map((price) => Number(price.replace('$', '').trim()));
    const sortedCopy = [...numericPrices].sort((a, b) => a - b);

    expect(numericPrices).toEqual(sortedCopy);
  });

  test('adds two products to cart and shows correct badge count', async ({ page }) => {
    await page.getByTestId('add-to-cart-sauce-labs-backpack').click();
    await page.getByTestId('add-to-cart-sauce-labs-bike-light').click();

    await expect(page.locator('.shopping_cart_badge')).toHaveText('2');
  });

  test('removes item from cart directly on inventory page', async ({ page }) => {
    await page.getByTestId('add-to-cart-sauce-labs-backpack').click();
    await expect(page.locator('.shopping_cart_badge')).toHaveText('1');

    await page.getByTestId('remove-sauce-labs-backpack').click();
    await expect(page.locator('.shopping_cart_badge')).toHaveCount(0);
  });

  test('keeps selected item visible when user opens cart', async ({ page }) => {
    // TODO: move these repeated cart actions to a page object once suite grows.
    await page.getByTestId('add-to-cart-sauce-labs-fleece-jacket').click();
    await page.locator('.shopping_cart_link').click();

    await expect(page).toHaveURL(/cart\.html/);
    await expect(page.getByText('Sauce Labs Fleece Jacket')).toBeVisible();
    await page.getByTestId('continue-shopping').click();
    await expect(page).toHaveURL(/inventory\.html/);
  });
});
