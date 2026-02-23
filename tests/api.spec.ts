import { expect, test, type APIRequestContext, type TestInfo } from '@playwright/test';
import { getFailureHelp } from '../utils/llmFailureExplainer';

let apiContext: APIRequestContext;

async function attachFailureHelp(testInfo: TestInfo): Promise<void> {
  if (testInfo.status === testInfo.expectedStatus) {
    return;
  }

  const help = await getFailureHelp({
    suite: 'API checks',
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

test.describe('REST API coverage', () => {
  test.afterEach(async ({}, testInfo) => {
    await attachFailureHelp(testInfo);
  });

  test.beforeAll(async ({ playwright }) => {
    apiContext = await playwright.request.newContext({
      baseURL: 'https://jsonplaceholder.typicode.com',
      extraHTTPHeaders: {
        'Content-Type': 'application/json',
      },
    });
  });

  test.afterAll(async () => {
    await apiContext.dispose();
  });

  test('GET /posts/1 returns expected post data', async () => {
    const response = await apiContext.get('/posts/1');
    const body = (await response.json()) as { id: number; userId: number; title: string };

    expect(response.status()).toBe(200);
    expect(body.id).toBe(1);
    expect(body.userId).toBeGreaterThan(0);
    expect(body.title.length).toBeGreaterThan(5);
  });

  test('GET /users returns non-empty list', async () => {
    const response = await apiContext.get('/users');
    const body = (await response.json()) as Array<{ id: number; email: string }>;

    expect(response.status()).toBe(200);
    expect(body.length).toBeGreaterThan(0);
    expect(body[0]?.email).toContain('@');
  });

  test('POST /posts creates a new post', async () => {
    const payload = {
      title: 'Playwright post from Tanishq',
      body: 'Checking create endpoint behavior',
      userId: 99,
    };

    const response = await apiContext.post('/posts', { data: payload });
    const body = (await response.json()) as { id: number; title: string; userId: number };

    expect(response.status()).toBe(201);
    expect(body.id).toBeTruthy();
    expect(body.title).toBe(payload.title);
    expect(body.userId).toBe(payload.userId);
  });

  test('PUT /posts/1 updates post fields', async () => {
    const payload = {
      id: 1,
      title: 'Updated by automation',
      body: 'full update test',
      userId: 1,
    };

    const response = await apiContext.put('/posts/1', { data: payload });
    const body = (await response.json()) as typeof payload;

    expect(response.status()).toBe(200);
    expect(body.title).toBe(payload.title);
    expect(body.body).toBe(payload.body);
  });

  test('handles 404 for unknown endpoint', async () => {
    // TODO: once real APIs are added, cover auth and schema validation here.
    const response = await apiContext.get('/definitely-missing-route');

    expect(response.status()).toBe(404);
  });
});
