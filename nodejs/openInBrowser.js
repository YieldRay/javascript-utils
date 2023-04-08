import { exec } from "node:child_process";
import { type } from "node:os";

export default function openInBrowser(u) {
    return exec((type() === "Windows_NT" ? "explorer" : "xdg-open") + " " + u);
}
