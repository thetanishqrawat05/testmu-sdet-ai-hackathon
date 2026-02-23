export type FailureExplanation = {
  summary: string;
  likelyCause: string;
  nextAction: string;
};

export function explainFailure(error: unknown): FailureExplanation {
  const message = error instanceof Error ? error.message : String(error);

  if (/timeout/i.test(message)) {
    return {
      summary: 'Test timed out before completing expected actions.',
      likelyCause: 'Slow page load, missing wait condition, or unstable locator.',
      nextAction: 'Validate locators and add a targeted wait for the blocked step.',
    };
  }

  if (/locator|not found|strict mode violation/i.test(message)) {
    return {
      summary: 'Element lookup failed.',
      likelyCause: 'Selector mismatch or UI changed.',
      nextAction: 'Update the locator to a stable role/text/test-id based selector.',
    };
  }

  return {
    summary: 'Test failed with an unclassified error.',
    likelyCause: 'Unexpected app behavior or environment issue.',
    nextAction: 'Review trace and console logs, then isolate the first failing action.',
  };
}
