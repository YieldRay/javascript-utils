/**
 * Same as `String.raw`
 */
export function r(strings: TemplateStringsArray, ...data: any[]) {
    let s = "";
    let i = 0;
    for (; i < strings.length - 1; i++) {
        s += strings.raw[i];
        s += data[i];
    }
    s += strings.raw[i];
    return s;
}
