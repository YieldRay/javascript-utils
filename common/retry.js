/**
 *
 * @param {function} fn `fn` should bind correct `this`
 * @param {function} until
 * @param {number} maxRetry
 * @param {number} sleepTime
 * @param {function} mapper Optional, this function can update `sleepTime`
 * @returns
 */
export default async function (fn, until = (result) => Boolean(result), maxRetry = 3, sleepTime = 0, mapper) {
    const sleep = (t) => new Promise((r) => setTimeout(() => r(), t));
    const toStringTag = (data) => Object.prototype.toString.call(data).slice(8, -1);
    const isPromise = (data) => toStringTag(data) === "Promise";

    let result;
    let waitTime = sleepTime;

    for (let i = 0; i < maxRetry; i++) {
        let hasError = false;
        result = fn();
        if (isPromise(result))
            try {
                result = await result;
            } catch {
                hasError = true;
            }
        if (!hasError && Boolean(until(result)) === true) return result;
        await sleep(waitTime);
        if (typeof mapper === "function") waitTime = mapper(waitTime);
        count++;
    }
    throw result;
}

// Example:
// retry(
//     () => fetch(/* ... */).then((res) => res.json()),
//     (data) => data.code === 200,
//     10,
//     1,
//     (time) => time * 2
// )
//     .then((successValue) => {})
//     .catch((errorValue) => {});
