export type PreDefinedRequestInit = RequestInit & Partial<{ baseURL: string }>;

/**
 * baseURL only works if you use a string as the first param of the returned fetch
 * @example
 * const fetchX = defineFetch(() => ({
 *     baseURL: "https://example.net/api/v1/",
 *     headers: {
 *         authentication: `Bearer ${localStorage.getItem("token") ?? ""}`,
 *     },
 * }));
 */
export function defineFetch(preInit: PreDefinedRequestInit | (() => PreDefinedRequestInit)) {
    return async function (input: RequestInfo | URL, init?: RequestInit) {
        const predefinedInit = typeof preInit === "function" ? preInit() : preInit;
        let reqInput = input;
        if (typeof input === "string" && predefinedInit && Reflect.has(predefinedInit, "baseURL")) {
            reqInput = Reflect.get(predefinedInit, "baseURL") + input;
        }
        return await fetch(reqInput, {
            ...predefinedInit,
            ...init,
            headers: mergeHeaders(predefinedInit.headers, init?.headers),
        });
    };
}

export type URLSearchParamsInit = string[][] | Record<string, string> | string | URLSearchParams;

export function mergeHeaders(dest?: HeadersInit, src?: HeadersInit) {
    const headers = new Headers(dest);
    new Headers(src).forEach((v, k) => {
        headers.set(k, v);
    });
    return headers;
}

export function headersToObject(headers: HeadersInit): Record<string, string> {
    return Object.fromEntries(Object.entries(new Headers(headers)));
}

export function buildFormData(data: Record<string, string | Blob> | Iterable<[string, string]>) {
    const fd = new FormData();
    (Reflect.get(data, Symbol.iterator) instanceof Function
        ? Array.from(data as Iterable<[string, string]>)
        : Object.entries(data)
    ).forEach(([k, v]) => fd.append(k, v));
    return fd;
}

/**
 * NO charset=utf-8 for this, as it's just for type hint
 */
export function formatContent(data: any, contentType: "application/json"): string;
/**
 * DO NOT add this to header as it will be automatically added by the fetch()
 */
export function formatContent(data: any, contentType: "multipart/form-data"): FormData;
export function formatContent(data: any, contentType: "application/x-www-form-urlencoded"): URLSearchParams;
/**
 * format content with given content-type
 */
export function formatContent(
    data: any,
    contentType: "application/json" | "application/x-www-form-urlencoded" | "multipart/form-data"
) {
    switch (contentType) {
        case "application/json":
            return JSON.stringify(data);
        case "application/x-www-form-urlencoded":
            return new URLSearchParams(data);
        case "multipart/form-data":
            return buildFormData(data);
        default:
            // unreachable in typescript
            return data;
    }
}
