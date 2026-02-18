import { useCallback, useRef } from 'react';

interface RetryOptions {
    maxRetries?: number;
    baseDelayMs?: number;
    shouldRetry?: (error: unknown) => boolean;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
    maxRetries: 3,
    baseDelayMs: 1000,
    shouldRetry: (error: unknown) => {
        // Only retry on network/replica errors, not on business logic errors
        const message = error instanceof Error ? error.message : String(error);
        return (
            message.includes('NetworkError') ||
            message.includes('Failed to fetch') ||
            message.includes('replica') ||
            message.includes('timeout') ||
            message.includes('ECONNREFUSED') ||
            message.includes('503') ||
            message.includes('502')
        );
    },
};

/**
 * Hook providing exponential backoff retry logic for canister calls.
 * 
 * Usage:
 *   const { withRetry } = useRetry();
 *   const result = await withRetry(() => actor.someMethod());
 */
export function useRetry(options?: RetryOptions) {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const abortRef = useRef(false);

    const withRetry = useCallback(
        async <T>(fn: () => Promise<T>): Promise<T> => {
            abortRef.current = false;
            let lastError: unknown;

            for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
                if (abortRef.current) {
                    throw new Error('Retry aborted');
                }

                try {
                    return await fn();
                } catch (error) {
                    lastError = error;

                    if (attempt < opts.maxRetries && opts.shouldRetry(error)) {
                        const delay = opts.baseDelayMs * Math.pow(2, attempt);
                        console.warn(
                            `[useRetry] Attempt ${attempt + 1}/${opts.maxRetries} failed, retrying in ${delay}ms...`,
                            error
                        );
                        await new Promise((resolve) => setTimeout(resolve, delay));
                    } else {
                        throw error;
                    }
                }
            }

            throw lastError;
        },
        [opts.maxRetries, opts.baseDelayMs, opts.shouldRetry]
    );

    const abort = useCallback(() => {
        abortRef.current = true;
    }, []);

    return { withRetry, abort };
}
