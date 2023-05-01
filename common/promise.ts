declare global {
    interface ArrayConstructor {
        /**
         * Creates a new, shallow-copied Array instance
         * from an async iterable, iterable, or array-like object.
         *
         * @param items
         * An async iterable, iterable, or array-like object to convert to an array.
         */
        fromAsync<T>(items: AsyncIterable<T>): Promise<T[]>;
        /**
         * Creates a new, shallow-copied Array instance
         * from an async iterable, iterable, or array-like object.
         *
         * @param items
         * An async iterable, iterable, or array-like object to convert to an array.
         */
        fromAsync<T>(items: Iterable<T> | ArrayLike<T>): Promise<Awaited<T>[]>;

        /**
         * Creates a new, shallow-copied Array instance
         * from an async iterable, iterable, or array-like object.
         *
         * @param items
         * An async iterable, iterable, or array-like object to convert to an array.
         *
         * @param mapfn
         * A function to call on every element of the array.
         * If provided, every value to be added to the array is first passed through this function,
         * and `mapFn`'s return value is added to the array instead awaited.
         */
        fromAsync<T, U>(items: AsyncIterable<T>, mapfn: (item: Awaited<T>, index: number) => U): Promise<Awaited<U>[]>;
        /**
         * Creates a new, shallow-copied Array instance
         * from an async iterable, iterable, or array-like object.
         *
         * @param items
         * An async iterable, iterable, or array-like object to convert to an array.
         *
         * @param mapfn
         * A function to call on every element of the array.
         * If provided, every value to be added to the array is first passed through this function,
         * and `mapFn`'s return value is added to the array instead awaited.
         */
        fromAsync<T, U>(
            items: Iterable<T> | ArrayLike<T>,
            mapfn: (item: Awaited<T>, index: number) => U
        ): Promise<Awaited<U>[]>;

        /**
         * Creates a new, shallow-copied Array instance
         * from an async iterable, iterable, or array-like object.
         *
         * @param items
         * An async iterable, iterable, or array-like object to convert to an array.
         *
         * @param mapfn
         * A function to call on every element of the array.
         * If provided, every value to be added to the array is first passed through this function,
         * and `mapFn`'s return value is added to the array instead (after being awaited).
         *
         * @param thisArg
         * Value to use as `this` when executing `mapFn`.
         */
        fromAsync<T, U, ThisType>(
            items: AsyncIterable<T>,
            mapfn: (this: ThisType, item: T, index: number) => U,
            thisArg: ThisType
        ): Promise<Awaited<U>[]>;
        /**
         * Creates a new, shallow-copied Array instance
         * from an async iterable, iterable, or array-like object.
         *
         * @param items
         * An async iterable, iterable, or array-like object to convert to an array.
         *
         * @param mapfn
         * A function to call on every element of the array.
         * If provided, every value to be added to the array is first passed through this function,
         * and `mapFn`'s return value is added to the array instead (after being awaited).
         *
         * @param thisArg
         * Value to use as `this` when executing `mapFn`.
         */
        fromAsync<T, U, ThisType>(
            items: Iterable<T> | ArrayLike<T>,
            mapfn: (this: ThisType, item: Awaited<T>, index: number) => U,
            thisArg: ThisType
        ): Promise<Awaited<U>[]>;
    }

    interface PromiseConstructor {
        withResolvers<T>(): {
            promise: Promise<T>;
            resolve: (value: T | PromiseLike<T>) => void;
            reject: (reason?: any) => void;
        };
    }
}

if (!Promise.withResolvers) {
    Promise.withResolvers = <T>() => {
        let resolve: (value: T | PromiseLike<T>) => void;
        let reject: (reason?: any) => void;
        const promise = new Promise<T>((res, rej) => {
            resolve = res;
            reject = rej;
        });
        //@ts-ignore
        return { promise, resolve, reject };
    };
}

export {};
