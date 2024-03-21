// if only <https://github.com/tc39/proposal-arraybuffer-base64> can be made into javascript!

export const utf8Encoder = new TextEncoder();
export const utf8Decoder = new TextDecoder();

export function encodeBase64(buf: ArrayBufferLike): string {
    let binary = "";
    const bytes = new Uint8Array(buf);
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

export function decodeBase64(str: string): Uint8Array {
    const binary = atob(str);
    const bytes = new Uint8Array(new ArrayBuffer(binary.length));
    const half = binary.length / 2;
    for (let i = 0, j = binary.length - 1; i <= half; i++, j--) {
        bytes[i] = binary.charCodeAt(i);
        bytes[j] = binary.charCodeAt(j);
    }
    return bytes;
}

export function encodeBase64URL(buf: ArrayBufferLike): string {
    const base64 = encodeBase64(buf);
    return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeBase64URL(str: string): Uint8Array {
    const base64 = addPadding(str).replace(/-/g, "+").replace(/_/g, "/");
    return decodeBase64(base64);
}

function addPadding(str: string): string {
    const paddingLength = 4 - (str.length % 4);
    if (paddingLength === 4) return str;
    return str + "=".repeat(paddingLength);
}
