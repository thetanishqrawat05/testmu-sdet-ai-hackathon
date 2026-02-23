import Groq from 'groq-sdk';

const GROQ_MODEL = 'llama3-8b-8192';
const PROMPT_CHAR_LIMIT = 3_500;

export type FailureHelpInput = {
  suite: string;
  testTitle: string;
  file: string;
  errorMessage: string;
  stack?: string;
};

function shortText(value: string | undefined, maxLength = 600): string {
  if (!value) {
    return '';
  }

  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength)}...`;
}

function buildPrompt(input: FailureHelpInput): string {
  const stack = shortText(input.stack, 1_500);

  return [
    'You are helping an SDET debug a failing Playwright test.',
    'Return plain text with exactly 3 sections:',
    '1) Why this likely failed',
    '2) What to check first',
    '3) Suggested code-level fix',
    '',
    `Suite: ${input.suite}`,
    `Test: ${input.testTitle}`,
    `File: ${input.file}`,
    `Error: ${shortText(input.errorMessage, 1_000)}`,
    `Stack: ${stack || 'No stack trace captured.'}`,
  ]
    .join('\n')
    .slice(0, PROMPT_CHAR_LIMIT);
}

function fallbackHelp(input: FailureHelpInput, reason?: string): string {
  const reasonLine = reason ? `Reason: ${reason}` : 'Reason: Groq key missing or request failed.';

  return [
    `Could not fetch Groq guidance. ${reasonLine}`,
    '',
    'Quick local guidance:',
    `- Re-check selector stability in ${input.file}`,
    '- Confirm the app state before the failing assertion',
    '- Open Playwright trace/video for the first failed step',
    '- Retry once after adding an explicit wait for the exact UI state',
  ].join('\n');
}

export async function getFailureHelp(input: FailureHelpInput): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return fallbackHelp(input, 'GROQ_API_KEY is not set.');
  }

  // I added this because debugging was taking too long in repeated flaky runs.
  const client = new Groq({ apiKey });

  try {
    const completion = await client.chat.completions.create({
      model: GROQ_MODEL,
      temperature: 0.2,
      max_tokens: 450,
      messages: [
        {
          role: 'system',
          content:
            'You are a senior SDET. Keep the answer practical, short, and specific to Playwright debugging.',
        },
        {
          role: 'user',
          content: buildPrompt(input),
        },
      ],
    });

    const output = completion.choices[0]?.message?.content?.trim();

    if (!output) {
      return fallbackHelp(input, 'Groq returned an empty message.');
    }

    return output;
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return fallbackHelp(input, reason);
  }
}
