import { encodeBase64 } from "./base64.ts";
import { signDataAsBase64 } from "./key_use.ts";

/**
 * `key` should be `CryptoKey`, use private key to sign and public key to verify
 *
 * `keyId` should be like `https://example.net/actor#main-key`
 *
 * see: [rfc7033](https://datatracker.ietf.org/doc/html/rfc7033#section-3.1)  [mastodon docs](https://docs.joinmastodon.org/spec/security/)
 */
export async function signedFetch(
    { key, keyId }: { key: CryptoKey; keyId: string },
    input: RequestInfo | URL,
    init?: RequestInit
) {
    const req = new Request(input, init);
    const url = new URL(req.url);

    // digest for request body
    const digest = "sha-256=" + encodeBase64(await crypto.subtle.digest("SHA-256", await req.arrayBuffer()));

    const date = new Date().toUTCString();

    const headersToSign = {
        "(request-target)": `${req.method.toLowerCase()} ${url.pathname + url.search}`,
        host: url.host,
        date,
        digest,
    };

    const toBeSignature = {
        keyId: encodeURIComponent(keyId),
        algorithm: "rsa-sha256",
        headers: Object.keys(headersToSign).join(" "),
        signature: await signDataAsBase64(
            key,
            Object.entries(headersToSign)
                .map(([key, val]) => `${key}: ${val}`)
                .join("\n")
        ),
    };

    const signature = Object.entries(toBeSignature)
        .map(([key, val]) => `${key}="${val}"`)
        .join(",");

    const headers = new Headers(req.headers);
    headers.set("date", date);
    headers.set("signature", signature);
    // the fetch API will set `host` header for us

    return await fetch(req, {
        body: req.body,
        cache: req.cache,
        credentials: req.credentials,
        headers,
        integrity: req.integrity,
        keepalive: req.keepalive,
        method: req.method,
        mode: req.mode,
        redirect: req.redirect,
        referrer: req.redirect,
        referrerPolicy: req.referrerPolicy,
        signal: req.signal,
    });
}
