import { decodeBase64, encodeBase64 } from "./base64";
import { importPublicKey } from "./key_from_text";

interface RequestBodyParsed {
    "@context": "https://www.w3.org/ns/activitystreams";
    id: string;
    actor: string; // actor should match keyId
    type?: string;
    to?: any;
    object?: any;
    signature?: any;
}

/**
 * verify the request (should be a POST request)
 * and return `await request.json()` (because this function consume request.body)
 *
 * note that verify a request may be time consuming!
 *
 */
export async function verifyRequest<T extends RequestBodyParsed = any>(
    request: Request,
    verifyDigest = false,
    fetch = globalThis.fetch
): Promise<T> {
    const signatureHeader = request.headers.get("signature");
    if (!signatureHeader) throw new Error("missing signature header");
    const {
        keyId, // url string
        headers: _signedHeaders, // space seperated string
        signature, // base64 string
    } = Object.fromEntries(
        signatureHeader.split(",").map((kv) => {
            const [k, ...vs] = kv.split("=");
            const v = vs.join("=");
            // ignore invalid
            if (!(v.startsWith('"') && v.endsWith('"'))) throw new Error("invalid signature header");
            return [k, v.slice(1, -1)];
        })
    );
    if (!keyId || !_signedHeaders || !signature)
        throw new Error("signature header should contain: keyId,headers,signature ");

    const signedHeaders = _signedHeaders.split(" ");
    if (!signedHeaders.includes("(request-target)")) throw new Error("missing (request-target) in signature.headers");
    if (!signedHeaders.includes("date")) throw new Error("missing date in signature.headers");

    if (Math.abs(new Date(request.headers.get("date")!).getTime() - Date.now()) > 30 * 1000) {
        // check the clock skew, in +-30s
        throw new Error("request is out of date");
    }

    if (verifyDigest && !signedHeaders.includes("digest")) throw new Error("missing digest in signature.headers");

    let requestBodyParsed: T; // to be return, should be same as `await request.json()`
    try {
        const u = new URL(keyId); // may throw
        u.hash = "";

        const requestBodyBuffer = await request.arrayBuffer();

        if (verifyDigest) {
            // we support to check sha-256 for now
            const digest = "sha-256=" + encodeBase64(await crypto.subtle.digest("SHA-256", requestBodyBuffer));
            if (digest !== request.headers.get("digest")!) {
                throw new Error("digest header is not matched");
            }
        }

        // this function consume the request.body, so it should return what it parsed
        requestBodyParsed = JSON.parse(new TextDecoder().decode(requestBodyBuffer)); // may throw

        // the actor who request, should use his keyId to sign
        if (requestBodyParsed.actor !== u.toString()) throw new Error("actor not match to keyId");

        const res = await fetch(u, { signal: AbortSignal.timeout(10 * 1000) }); // may throw

        if (!res.ok) new Error(`cannot fetch keyId, reason: ${res.status} ${res.statusText}`);

        const json = (await res.json()) as {
            "@context": ["https://www.w3.org/ns/activitystreams", "https://w3id.org/security/v1"];
            id: string;
            publicKey: {
                id: string; // same as keyId
                owner: string; // actor
                publicKeyPem: string;
            }; // may throw
        };

        const publicKey = await importPublicKey(json.publicKey.publicKeyPem); // may throw

        const verifyResult = await crypto.subtle.verify(
            "RSASSA-PKCS1-v1_5",
            publicKey,
            decodeBase64(signature),
            new TextEncoder().encode(
                signedHeaders
                    .map((h) => {
                        if (h.startsWith("(") && h.endsWith(")")) {
                            const u = new URL(request.url);
                            if (h === "(request-target)")
                                return `${h}: ${request.method.toLowerCase()} ${u.pathname}${u.search}`;
                            throw new Error(`pseudo header ${h} is not supported`);
                        }
                        return `${h}: ${request.headers.get(h)}`;
                    })
                    .join("\n")
            )
        );

        if (!verifyResult) throw new Error("fail to verify the signature header");

        return requestBodyParsed;
    } catch (e) {
        throw e;
    }
}
