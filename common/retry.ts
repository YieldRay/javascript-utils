const sleep = (t: number) => new Promise((r) => setTimeout(r, t));

/**
 * @example
 * const text = await retryError(
 *     async () => {
 *         const res = await fetch("https://example.net");
 *         if (!res.ok) throw new Error();
 *         return await res.text();
 *     },
 *     0.3,
 *     (t) => t * 2,
 *     (e) => console.error(e)
 * );
 */
export async function retryError<Result>(
    fn: () => Result | Promise<Result>,
    initSleepTime = 0,
    sleepTimeMapper?: (lastSleepTime: number) => number,
    onError?: (error: unknown, errorTimes: number) => boolean | void
): Promise<Result> {
    let waitTime = initSleepTime;
    let errorTimes = 0;
    for (;;) {
        try {
            return await fn();
        } catch (e) {
            if (onError?.(e, errorTimes)) {
                throw new Error("Mannally stop the retry");
            }
        } finally {
            await sleep(waitTime);
            if (sleepTimeMapper) waitTime = sleepTimeMapper(waitTime);
        }
    }
}
