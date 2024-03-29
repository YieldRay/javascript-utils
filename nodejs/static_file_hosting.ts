import { createServer } from "node:http";
import { createReadStream, readdirSync, existsSync, statSync } from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";

function contentTypeMiddleware(
    mapping: Record<string, string> = {
        htm: "text/html",
        html: "text/html",
        xhtml: "application/xhtml+xml",
        js: "text/javascript",
        mjs: "text/javascript",
        cjs: "text/javascript",
        css: "text/css",
        sh: "application/x-sh",
        txt: "text/plain",
        csv: "text/csv",
        json: "application/json",
        xml: "application/xml",
        svg: "image/svg+xml",
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        png: "image/png",
        gif: "image/gif",
        webp: "image/webp",
        pdf: "application/pdf",
        wav: "audio/wav",
        mp3: "audio/mp3",
        mp4: "video/mpeg4",
        bin: "application/octet-stream",
    }
) {
    return (req: IncomingMessage, res: ServerResponse) => {
        const basename = req.url?.slice(1).split("/").reverse()[0] || "";
        if (basename.includes(".")) {
            const ext = basename.split(".").reverse()[0];
            const ct = mapping[ext];
            if (ct) {
                res.setHeader("content-type", ct);
            }
        }
    };
}

function staticMiddleware(pathPrefix = ".", disableIndex = false) {
    return (req: IncomingMessage, res: ServerResponse) => {
        const filepath =
            pathPrefix +
            (() => {
                const path = req.url || "";
                if (path.endsWith("/")) {
                    res.setHeader("content-type", "text/html");
                    return path + "index.html";
                } else {
                    return path;
                }
            })();

        if (existsSync(filepath) && statSync(filepath).isFile()) {
            createReadStream(filepath).pipe(res);
        } else {
            // index.html does not exists here
            res.setHeader("content-type", "text/html");
            if (!disableIndex && filepath.endsWith("/index.html")) {
                // send dynamic index.html
                const dir = filepath.replace(/index\.html$/, "");
                const lis = readdirSync(dir).map((name) => {
                    const stat = statSync(dir + name);
                    if (stat.isFile()) return `<li><a href="${name}">${name}</a></li>`;
                    if (stat.isDirectory()) return `<li><a href="${name}/">${name}/</a></li>`;
                });
                res.end(
                    `<html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Index of ${dir}</title></head><body><h1>Index of ${dir}</h1><ul>${lis.join(
                        ""
                    )}</ul></body></html>`
                );
            } else {
                // send 404
                res.writeHead(404);
                res.end(
                    `<html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>404 Not Found</title></head><body><center><h1>404 Not Found</h1></center><hr><center>node.js</center></body></html>`
                );
            }
        }
    };
}

export default function host(port = 8080, pathPrefix = ".", disableIndex = false) {
    return createServer((req, res) => {
        contentTypeMiddleware()(req, res);
        staticMiddleware(pathPrefix, disableIndex)(req, res);
    }).listen(port);
}

// Usage:
// host(8080);
