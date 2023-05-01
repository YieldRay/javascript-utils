/**
 * Get a value without throws
 */
export function produce<T>(producer: () => T, default_: T): T;
export function produce<T>(producer: () => T, default_?: undefined): T | undefined;
export function produce<T>(producer: () => T, default_?: T) {
    try {
        return producer();
    } catch {
        return default_;
    }
}

export type Primitive = string | number | boolean | null | undefined | symbol | bigint;
type Cases<T extends Primitive, U> = Array<[case_: T | T[] | ((value: T) => boolean), return_: U]>;
/**
 * match for primitive type.
 * T is for return type.
 * U is for narrowing primitive type.
 * @example
 * const result = match<string, number>(
    produce(() => 3)!,
    [
        [0, "zero"],
        [1, "one"],
        [2, "two"],
        [3, "three"],
        [[4, 5], "four or five"],
        [(x) => x >= 6, "more than five"],
        [(x) => x < 0, "negative"],
    ],
    "unknown"
); // => three

 */
export function match<T, U extends Primitive = Primitive>(value: U, cases: Cases<U, T>, default_: T): T;
export function match<T, U extends Primitive = Primitive>(
    value: U,
    cases: Cases<U, T>,
    default_?: undefined
): T | undefined;
export function match<T, U extends Primitive = Primitive>(value: U, cases: Cases<U, T>, default_?: T) {
    for (const [case_, return_] of cases) {
        if (Array.isArray(case_)) {
            if (case_.includes(value)) return return_;
        } else if (case_ instanceof Function) {
            if (case_(value)) return return_;
        } else {
            if (case_ === value) return return_;
        }
    }
    return default_;
}

export function ref<T>(init: T): [getter: () => T, setter: (newValue: T) => void] {
    let value: T = init;
    const setter = (newValue: T) => {
        value = newValue;
    };
    const getter = () => value;
    return [getter, setter];
}
