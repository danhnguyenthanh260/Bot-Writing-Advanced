/**
 * Timeout utilities for handling long-running operations
 */

/**
 * Create a promise that rejects after timeout
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage?: string
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(new Error(errorMessage || `Operation timed out after ${timeoutMs}ms`)),
        timeoutMs
      )
    ),
  ]);
}

/**
 * Retry with exponential backoff and timeout
 */
export async function retryWithTimeout<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number;
    timeoutMs?: number;
    initialDelayMs?: number;
    maxDelayMs?: number;
    backoffMultiplier?: number;
  } = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    timeoutMs = 30000,
    initialDelayMs = 1000,
    maxDelayMs = 10000,
    backoffMultiplier = 2,
  } = options;

  let lastError: Error | null = null;
  let delay = initialDelayMs;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await withTimeout(fn(), timeoutMs, `Attempt ${attempt} timed out`);
    } catch (error: any) {
      lastError = error;
      
      if (attempt === maxAttempts) {
        break;
      }

      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, delay));
      delay = Math.min(delay * backoffMultiplier, maxDelayMs);
    }
  }

  throw lastError || new Error('All retry attempts failed');
}

