//
import crypto from "node:crypto";

// the type is incomplete
function curry(func: Function) {
    return function curried(...args: any) {
        if (args.length >= func.length) {
            //@ts-ignore
            return func.apply(this, args);
        } else {
            return function (...args2: any) {
                //@ts-ignore
                return curried.apply(this, args.concat(args2));
            };
        }
    };
}

const createHash = (algorithm: string, data: crypto.BinaryLike, digest: crypto.BinaryToTextEncoding = "hex") =>
    crypto.createHash(algorithm).update(data).digest(digest);

const createHmac = (
    algorithm: string,
    data: crypto.BinaryLike,
    salt: crypto.BinaryLike | crypto.KeyObject,
    digest: crypto.BinaryToTextEncoding = "hex"
) => crypto.createHmac(algorithm, salt).update(data).digest(digest);

const genHash = curry((algorithm: string, data: crypto.BinaryLike) =>
    crypto.createHash(algorithm).update(data).digest("hex")
);

const genHmac = curry((algorithm: string, salt: crypto.BinaryLike | crypto.KeyObject, data: crypto.BinaryLike) =>
    crypto.createHmac(algorithm, salt).update(data).digest("hex")
);

export { createHash, createHmac, genHash, genHmac };

// Usage:
// console.log(createHash("md5", "password"));
// console.log(genHash("md5")("password"));
