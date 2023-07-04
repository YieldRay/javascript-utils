const sleep = (t: number) => new Promise((r) => setTimeout(r, t));

/**
 * @description run promises one by one, rather than Promise.all()
 */
export async function promiseSuccessive<T = any>(values: Promise<T>[], wait: number = 0) {
    const result: T[] = [];
    for (const p of values) {
        const r = await p;
        result.push(r);
        if (wait > 0) {
            // if not the last one, sleep
            if (p !== values[values.length - 1]) await sleep(wait);
        }
    }
    return result;
}
