type WriteFn = {
    (buffer: Uint8Array | string, cb?: (err?: Error) => void): boolean;
    (str: Uint8Array | string, encoding?: BufferEncoding, cb?: (err?: Error) => void): boolean;
};

const print: WriteFn = process.stdout.write.bind(process.stdout);
const eprint: WriteFn = process.stderr.write.bind(process.stderr);
const println: WriteFn = (s, ...args) => print(s + "\n", ...args);
const eprintln: WriteFn = (s, ...args) => eprint(s + "\n", ...args);

const printToStartOfLine = (() => {
    type PrintToStartOfLineFn = {
        (s: any): void;
        setLastLength: (n: number) => void;
    };
    // do not use this func to print object or array!!!
    let lastLineLength = 0;
    const closure: PrintToStartOfLineFn = ((s: any) => {
        const str = String(s); // ! convert any input to string, rather than what console.log() do
        const neededLength = Math.max(lastLineLength - str.length, 0);
        print("\r" + str + " ".repeat(neededLength) + "\b".repeat(neededLength));
        lastLineLength = str.length;
    }) as any;

    // manually set the length of last print string, which is the count of the next print need to clear
    closure.setLastLength = (n = 0) => (lastLineLength = n);
    return closure;
})();

export { print, println, eprint, eprintln, printToStartOfLine };

// Usage:
// for (let i = 10; i > 0; i--) {
//     await new Promise((res) =>
//         setTimeout(() => {
//             res();
//         }, 500)
//     );
//     printToStartOfLine(`${i} `.repeat(i));
// }
