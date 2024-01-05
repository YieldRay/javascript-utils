export async function generateRSAKeyPair(): Promise<{
    privateKey: CryptoKey;
    publicKey: CryptoKey;
}> {
    const keyPair = await crypto.subtle.generateKey(
        {
            name: "RSASSA-PKCS1-v1_5",
            modulusLength: 2048,
            publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
            hash: { name: "SHA-256" },
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
    const exportedPem = arrayBufferToPem(exportedKey, "PRIVATE KEY");
    return exportedPem;
}

export async function exportPublicKey(key: CryptoKey): Promise<string> {
    const exportedKey = await crypto.subtle.exportKey("spki", key);
    const exportedPem = arrayBufferToPem(exportedKey, "PUBLIC KEY");
    return exportedPem;
}

function arrayBufferToPem(buffer: ArrayBuffer, label: "PRIVATE KEY" | "PUBLIC KEY") {
    const pemHeader = `-----BEGIN ${label}-----`;
    const pemFooter = `-----END ${label}-----`;

    const binary = String.fromCharCode.apply(null, new Uint8Array(buffer) as any as number[]);
    const base64 = btoa(binary);

    let pem = pemHeader + "\n";
    let offset = 0;

    while (offset < base64.length) {
        const line = base64.substr(offset, 64);
        pem += line + "\n";
        offset += 64;
    }
    pem += pemFooter + "\n";
    return pem;
}
