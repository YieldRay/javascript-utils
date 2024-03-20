import { encodeBase64, decodeBase64 } from "./base64.ts";
import { ALGORITHM } from "./key_to_text.ts";

/**
 * @returns signature
 */
export async function signData(key: CryptoKey, data: BufferSource | string): Promise<ArrayBuffer> {
    return await crypto.subtle.sign(ALGORITHM, key, typeof data === "object" ? data : new TextEncoder().encode(data));
}

/**
 * @returns signature as base64 string
 */
export async function signDataAsBase64(key: CryptoKey, data: BufferSource | string) {
    return encodeBase64(await signData(key, data));
}

export async function verifyData(
    key: CryptoKey,
    data: BufferSource | string,
    signature: BufferSource
): Promise<boolean> {
    return await crypto.subtle.verify(
        ALGORITHM,
        key,
        signature,
        typeof data === "object" ? data : new TextEncoder().encode(data)
    );
}

/**
 * note that it's the signature in base64, not the data
 */
export async function verifyDataFromBase64(
    key: CryptoKey,
    data: BufferSource | string,
    signatureInBase64: string
): Promise<boolean> {
    const signature = decodeBase64(signatureInBase64);
    return verifyData(key, data, signature);
}
