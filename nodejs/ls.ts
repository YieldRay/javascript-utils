import { opendir } from "node:fs/promises";

async function ls(path = "./", showHidden = false) {
    const files: string[] = [];
    const folders: string[] = [];

    const dir = await opendir(path);
    for await (const dirent of dir) {
        if (!showHidden && dirent.name.startsWith(".")) continue;
        (dirent.isDirectory() ? folders : files).push(dirent.name);
    }

    return { folders, files };
}

export default ls;

// Usage:
// ls().then(console.log);
// http://nodejs.cn/api/fs.html#class-fsdirent
