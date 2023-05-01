// 如果方便异步则应使用 localforage
// https://localforage.docschina.org/

export function setItem(key: string, val: any) {
    localStorage.setItem(key, JSON.stringify(val));
}

export function getItem<T = any>(key: string) {
    const val = localStorage.getItem(key);
    if (!val) return undefined;
    return JSON.parse(val) as T;
}
