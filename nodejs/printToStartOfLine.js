const print = process.stdout.write.bind(process.stdout);
const eprint = process.stderr.write.bind(process.stderr);
const println = (s) => print(s + "\n");
const eprintln = (s) => eprint(s + "\n");
const printToStartOfLine = (() => {
    // do not use this func to print object or array!!!
    let lastLineLength = 0;
    let closure = function (s) {
        const str = String(s); // ! convert any input to string, rather than console.log()
        const neededLength = Math.max(lastLineLength - str.length, 0);
        print("\r" + str + " ".repeat(neededLength) + "\b".repeat(neededLength));
        lastLineLength = str.length;
    };
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
