import crypto from "node:crypto";

function curry(func) {
    return function curried(...args) {
        if (args.length >= func.length) {
            return func.apply(this, args);
        } else {
            return function (...args2) {
                return curried.apply(this, args.concat(args2));
            };
        }
    };
}

const createHash = (algorithm, data, digest = "hex") => crypto.createHash(algorithm).update(data).digest(digest);

const createHmac = (algorithm, data, salt, digest = "hex") =>
    crypto.createHmac(algorithm, salt).update(data).digest(digest);

const genHash = curry((algorithm, data) => crypto.createHash(algorithm).update(data).digest("hex"));

const genHmac = curry((algorithm, salt, data) => crypto.createHmac(algorithm, salt).update(data).digest("hex"));

export { createHash, createHmac, genHash, genHmac };

// Usage:
// console.log(createHash("md5", "password"));
// console.log(genHash("md5")("password"));
