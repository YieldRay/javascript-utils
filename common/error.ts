// see:
// https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Error/stack
// https://nodejs.org/api/errors.html#errorstack

export function v8_inspect(error: Error) {
    if (!error.stack) return;
    const [_, ...stacks] = error.stack.split(/^\s*at\s/m);
    return stacks.map((s) => {
        if (s.endsWith("\n")) s = s.slice(0, -1);
        const [name, source] = twoParts(s, " (");
        return { name, source: source.slice(0, -1) };
    });
}

function twoParts(s: string, needle: string) {
    const i = s.indexOf(needle);
    if (i === -1) return [s, ""];
    return [s.slice(0, i), s.slice(i + needle.length)];
}
