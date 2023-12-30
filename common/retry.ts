export class AttemptTimeoutError extends Error {
    timeout: number;
    constructor(timeout: number) {
        super(`Attempt exceeded the timeout (${timeout}).`);
        this.timeout = timeout;
        this.name = "AttemptTimeoutError";
    }
}

export class RetryError extends Error {
    attempts: number;
    constructor(attempts: number) {
        super(`Retrying exceeded the maxAttempts (${attempts}).`);
        this.attempts = attempts;
        this.name = "RetryError";
    }
}

interface RetryOptions {
    /**
     * timeout for each attempt, in milliseconds, default Infinity,
     * does not have effect if it's not an async function
     */
    timeout?: number;
    /**
     * @param timeout  last timeout
     * @param attempts attempt count
     */
    timeoutMap?: (timeout: number, attempts: number) => number;
    /**
     * sleep time for each attempt, in milliseconds, default 0
     */
    sleepTime?: number;
    /**
     * @param sleepTime  last sleep time
     * @param attempts attempt count
     */
    sleepTimeMap?: (sleepTime: number, attempts: number) => number;
    /**
     * max attempt count, default Infinity
     */
    maxAttempts?: number;
    /**
     * error callback for each error attempt, `e` is the error thrown by the function,
     * it will be `AttemptTimeoutError` if is caused by timeout
     */
    onError?: (e: unknown | AttemptTimeoutError, attempts: number) => void;
}

/**
 * keep in mind to set the `maxAttempts` option to avoid infinity loop!
 * as it set to Infinity by default just for prototype use!
 */
export async function retry<T>(fn: (() => T) | (() => Promise<T>), options?: RetryOptions): Promise<T> {
    let timeout = options?.timeout || Infinity;
    let sleepTime = options?.sleepTime || 0;
    const maxAttempts = options?.maxAttempts || Infinity;
    let attempts = 0;

    const timeoutSymbol = Symbol("timeout");
    while (attempts <= maxAttempts) {
        try {
            const timeoutPromise = new Promise<typeof timeoutSymbol>((r) =>
                setTimeout(() => r(timeoutSymbol), timeout)
            );
            const result = await Promise.race([timeoutPromise, fn()]);
            if (result !== timeoutSymbol) return result;
            throw new AttemptTimeoutError(timeout);
        } catch (e) {
            options?.onError?.(e, attempts);
        }
        // sleep before next attempt, but do not sleep if it is last attempt
        if (attempts < maxAttempts) await new Promise((r) => setTimeout(r, sleepTime));
        else break;
        // update timeout and sleepTime
        if (options?.timeoutMap) timeout = options.timeoutMap(timeout, attempts);
        if (options?.sleepTimeMap) timeout = options.sleepTimeMap(sleepTime, attempts);
        attempts++;
    }

    throw new RetryError(attempts);
}
