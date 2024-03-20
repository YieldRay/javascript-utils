import { ALGORITHM } from "./key_to_text.ts";

export async function importPrivateKey(pem: string): Promise<CryptoKey> {
    const binaryBuffer = pemToBuffer(pem, "PRIVATE KEY");
    const privateKey = await crypto.subtle.importKey("pkcs8", binaryBuffer, ALGORITHM, true, ["sign"]);
    return privateKey;
}

export async function importPublicKey(pem: string): Promise<CryptoKey> {
    const binaryBuffer = pemToBuffer(pem, "PUBLIC KEY");
    const publicKey = await crypto.subtle.importKey("spki", binaryBuffer, ALGORITHM, true, ["verify"]);
    return publicKey;
}

function pemToBuffer(pem: string, label: "PRIVATE KEY" | "PUBLIC KEY") {
    const trimmed = pem.trim();
    const pemHeader = `-----BEGIN ${label}-----`;
    const pemFooter = `-----END ${label}-----`;
    const pemContents = trimmed.substring(pemHeader.length, trimmed.length - pemFooter.length);

    const binaryString = atob(pemContents);
    const binaryBuffer = new Uint8Array(binaryString.length);

    for (let i = 0; i < binaryString.length; i++) {
        binaryBuffer[i] = binaryString.charCodeAt(i);
    }
    return binaryBuffer;
}
