import { exec as _exec, execSync } from "node:child_process";
import { promisify } from "node:util";

const exec = promisify(_exec); // => { stdout, stderr }

const system = (cmd) =>
    execSync(cmd, {
        stdio: ["inherit", "inherit", "inherit"],
    });

export { exec, system };
