import { encodeBase64, decodeBase64 } from "./base64.ts";
import { ALGORITHM } from "./key_to_text.ts";

export async function signDataAsBase64(key: CryptoKey, data: BufferSource | string) {
    return encodeBase64(await signData(key, data));
}

export async function signData(key: CryptoKey, data: BufferSource | string): Promise<ArrayBuffer> {
    return await crypto.subtle.sign(ALGORITHM, key, typeof data === "object" ? data : new TextEncoder().encode(data));
}

export async function verifyDataFromBase64(key: CryptoKey, data: string, signature: string): Promise<boolean> {
    const decodedSignature = decodeBase64(signature);
    return verifyData(key, data, decodedSignature);
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
