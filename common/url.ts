/**
 * use `URL.canParse()` instead if you do not check url
 */
export function isUrl(url: string): boolean {
    try {
        const { protocol } = new URL(url);
        return protocol === "http:" || protocol === "https:";
    } catch {
        return false;
    }
}
