import { encodeBase64 } from "./base64.ts";

export const ALGORITHM = {
    name: "RSASSA-PKCS1-v1_5",
    hash: { name: "SHA-256" },
} as const;

export async function generateRSAKeyPair(): Promise<{
    privateKey: CryptoKey;
    publicKey: CryptoKey;
}> {
    const keyPair = await crypto.subtle.generateKey(
        {
            ...ALGORITHM,
            modulusLength: 2048,
            publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
        },
        true,
        ["sign", "verify"]
    );

    return keyPair;
}

export async function exportKeyPair(keyPair: CryptoKeyPair): Promise<{
    publicKey: string;
    privateKey: string;
}> {
    const publicKey = await exportPublicKey(keyPair.publicKey);
    const privateKey = await exportPrivateKey(keyPair.privateKey);
    return {
        publicKey,
        privateKey,
    };
}

export async function exportPrivateKey(key: CryptoKey): Promise<string> {
    const exportedKey = await crypto.subtle.exportKey("pkcs8", key);
    return arrayBufferToPem(exportedKey, "PRIVATE KEY");
}

export async function exportPublicKey(key: CryptoKey): Promise<string> {
    const exportedKey = await crypto.subtle.exportKey("spki", key);
    return arrayBufferToPem(exportedKey, "PUBLIC KEY");
}

function arrayBufferToPem(buffer: ArrayBuffer, label: "PRIVATE KEY" | "PUBLIC KEY") {
    const pemHeader = `-----BEGIN ${label}-----`;
    const pemFooter = `-----END ${label}-----`;
    return `${pemHeader}\n${encodeBase64(buffer)}\n${pemFooter}`;
}
