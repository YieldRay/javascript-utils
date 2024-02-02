type WriteFn = {
    (buffer: Uint8Array | string, cb?: (err?: Error) => void): boolean;
    (str: Uint8Array | string, encoding?: BufferEncoding, cb?: (err?: Error) => void): boolean;
};

const print: WriteFn = process.stdout.write.bind(process.stdout);
const eprint: WriteFn = process.stderr.write.bind(process.stderr);
//@ts-ignore
const println: WriteFn = (s, ...args) => print(s + "\n", ...args);
//@ts-ignore
const eprintln: WriteFn = (s, ...args) => eprint(s + "\n", ...args);

export { print, println, eprint, eprintln };

// Usage:
// for (let i = 10; i > 0; i--) {
//     await new Promise((res) =>
//         setTimeout(() => {
//             res();
//         }, 500)
//     );
//     printToStartOfLine(`${i} `.repeat(i));
// }

export async function spinner<T>(callback: () => T): Promise<T>;
export async function spinner<T>(title: string, callback: () => T): Promise<T>;
export async function spinner<T>(title: string | (() => T), callback?: () => T): Promise<T> {
    if (typeof title == "function") {
        callback = title;
        title = "";
    }
    let i = 0;
    const spin = () => process.stderr.write(`  ${"⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏"[i++ % 10]} ${title}\r`);

    const id = setInterval(spin, 100);
    let result: T;
    try {
        result = await callback!();
    } finally {
        clearInterval(id);
        process.stderr.write(" ".repeat(process.stdout.columns - 1) + "\r");
    }
    return result;
}
