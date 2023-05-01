import { stdin, stdout, title } from "node:process";
import { promisify } from "node:util";
import readline from "node:readline";
import type { Abortable } from "node:events";
// https://nodejs.org/api/readline.html
// in Node.js >= 17, the question API has been provided by node:readline/promises
// which means you do not need this custom API anymore.

const rl = readline.createInterface({
    input: stdin,
    output: stdout,
});

type QuestionFn = {
    (query: string, callback: (answer: string) => void): void;
    (query: string, options: Abortable, callback: (answer: string) => void): void;
};

const question: QuestionFn = promisify(rl.question).bind(rl);
const quit = () => process.stdin.unref();

export { title, rl, question, quit };

// Usage:
// const history = [];
// rl.on("line", (line) => {
//     history.push(line);
// });
