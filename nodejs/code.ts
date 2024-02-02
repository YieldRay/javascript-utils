import { isBuiltin } from "node:module";

const importRe = [
    /\bimport\s+['"](?<path>[^'"]+)['"]/,
    /\bimport\(['"](?<path>[^'"]+)['"]\)/,
    /\brequire\(['"](?<path>[^'"]+)['"]\)/,
    /\bfrom\s+['"](?<path>[^'"]+)['"]/,
];
const nameRe = /^(?<name>(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*)\/?.*$/i;
const versionRe = /(\/\/|\/\*)\s*@(?<version>[~^]?(v?[\dx*]+([-.][\d*a-z-]+)*))/i;

export function parseDeps(content: Buffer): Record<string, string> {
    const deps: Record<string, string> = {};
    const lines = content.toString().split("\n");
    for (let line of lines) {
        const tuple = parseImports(line);
        if (tuple) {
            deps[tuple.name] = tuple.version;
        }
    }
    return deps;
}

function parseImports(line: string): { name: string; version: string } | undefined {
    for (let re of importRe) {
        const name = parsePackageName(re.exec(line)?.groups?.path);
        const version = parseVersion(line);
        if (name) {
            return { name, version };
        }
    }
}

function parsePackageName(path?: string): string | undefined {
    if (!path) return;
    const name = nameRe.exec(path)?.groups?.name;
    if (name && !isBuiltin(name)) {
        return name;
    }
}

function parseVersion(line: string) {
    return versionRe.exec(line)?.groups?.version || "latest";
}
