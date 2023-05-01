import { exec as _exec, execSync } from "node:child_process";
import { promisify } from "node:util";

const exec = promisify(_exec); // => { stdout, stderr }

const system = (command: string) =>
    execSync(command, {
        stdio: ["inherit", "inherit", "inherit"],
    });

export { exec, system };
