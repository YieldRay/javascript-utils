import { encodeBase64 } from "./base64.ts";

export async function signDataAsBase64(key: CryptoKey, data: BufferSource | string) {
    return encodeBase64(await signData(key, data));
}

export async function signData(key: CryptoKey, data: BufferSource | string): Promise<ArrayBuffer> {
    return await crypto.subtle.sign(
        {
            name: "RSASSA-PKCS1-v1_5",
            hash: { name: "SHA-256" },
        },
        key,
        typeof data === "object" ? data : new TextEncoder().encode(data)
    );
}
