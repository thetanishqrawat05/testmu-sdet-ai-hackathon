Hi, I'm Tanishq, and I built this Playwright + TypeScript framework for the TestMu AI SDET Hackathon.

I wanted this to look and feel like a practical SDET framework, not a demo-only setup. So I focused on readable tests, stable configuration, and fast debugging when failures happen.

## What this project includes

- Playwright + TypeScript framework for UI and API testing
- Realistic UI suites for login and dashboard/cart flows
- REST API suite for GET/POST/PUT and error handling
- Groq-based failure helper (`llama3-8b-8192`) with fallback guidance
- Trace/video/screenshot capture for failures
- HTML + JUnit reporting

## Current suite status

- Total tests discovered: **17**
- Files:
  - `tests/login.spec.ts` (6 tests)
  - `tests/dashboard.spec.ts` (6 tests)
  - `tests/api.spec.ts` (5 tests)

## Project structure

```text
.
|-- playwright.config.ts
|-- tsconfig.json
|-- tests/
|   |-- login.spec.ts
|   |-- dashboard.spec.ts
|   `-- api.spec.ts
|-- utils/
|   `-- llmFailureExplainer.ts
|-- package.json
|-- package-lock.json
|-- .env.example
`-- README.md
```

## Failure analysis flow

Each suite has an `afterEach` hook. If a test fails:

1. Failure context is collected (suite, title, file, message, stack)
2. `getFailureHelp()` in `utils/llmFailureExplainer.ts` calls Groq
3. Response is attached as `failure-help.txt` to Playwright artifacts
4. If key/network fails, local fallback guidance is returned

## Environment setup

1. Install dependencies

```bash
npm install
```

2. Install browsers

```bash
npx playwright install
```

3. Create `.env` (or copy from `.env.example`)

```bash
GROQ_API_KEY=your_groq_key_here
BASE_URL=https://www.saucedemo.com
```

## Run commands

```bash
npm run test:list
npm test
npm run test:headed
npm run test:ui
npm run test:debug
npm run test:report
npm run typecheck
```

## Config choices I made

From `playwright.config.ts`:

- retries: `2` on CI, `1` locally
- `forbidOnly` enabled on CI
- `trace: retain-on-failure`
- `video: retain-on-failure`
- `screenshot: only-on-failure`
- reporters: `list`, `html`, `junit`

## Why I built it this way

I wanted a one-day framework that is still clean enough to scale:

- easy for reviewers to read
- enough depth in scenarios to show test design quality
- enough diagnostics to debug quickly without guesswork

If you are reviewing this hackathon submission, this is my complete baseline framework and ready to extend with page objects, data-driven runs, and CI pipeline checks.
