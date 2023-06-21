import fs from "node:fs/promises";

const isFile = async (filePath: string) =>
    await fs
        .stat(filePath)
        .then((stat) => stat.isFile())
        .catch((_) => false);

const isDirectory = async (filePath: string) =>
    await fs
        .stat(filePath)
        .then((stat) => stat.isDirectory())
        .catch((_) => false);

const isExists = async (filePath: string) =>
    await fs
        .access(filePath)
        .then(() => true)
        .catch((_) => false);

export { isFile, isDirectory, isExists };
