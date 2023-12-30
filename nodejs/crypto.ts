import crypto from "node:crypto";

// the type is incomplete
function curry(func: Function) {
    return function curried(...args: any) {
        if (args.length >= func.length) {
            return func.apply(this, args);
        } else {
            return function (...args2: any) {
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

const genHash = curry((algorithm, data) => crypto.createHash(algorithm).update(data).digest("hex"));

const genHmac = curry((algorithm, salt, data) => crypto.createHmac(algorithm, salt).update(data).digest("hex"));

export { createHash, createHmac, genHash, genHmac };

// Usage:
// console.log(createHash("md5", "password"));
// console.log(genHash("md5")("password"));
