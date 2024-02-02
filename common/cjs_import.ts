/**
 * Prefer esm.sh rather than this!
 * @example
 * const snarkdown = await cjsImport("snarkdown")
 *
 */
export async function cjsImport<T = any>(url: string | URL) {
    const res = await fetch(pkg2url(url));
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    const code = await res.text();
    const module = {
        id: "<repl>",
        path: ".",
        exports: {},
        filename: null,
        loaded: false,
        children: [],
        paths: [],
    };
    globalThis.process ??= { env: {} };
    Function("module", "exports", code)(module, module.exports);
    return module.exports as T;
}

globalThis.require ??= (...args) => {
    throw new Error(`require(${args.map((a) => JSON.stringify(a))}) is not supported!`);
};

function pkg2url(packageName: string | URL) {
    if (URL.canParse(packageName)) return packageName;
    return "https://unpkg.com/" + packageName;
}
