import http from "node:http";
import { Duplex } from "node:stream";

/**
 * implement deno's serve function, which is useful for
 * transforming some simple Deno Deploy Playground scripts to node.js script
 * @see https://deno.land/std/http/server.ts?s=serve
 */
export function serve(
    handler: (req: Request) => Response,
    options?: {
        port?: number;
        onError?: (error: unknown) => Promise<Response>;
        onListen?: (params: { hostname: string; port: number }) => void;
    }
) {
    const port = options?.port ?? 3000;
    http.createServer((req, res) => {
        const webReq = incoming2request(req); // node req to web req
        const webRes = handler(webReq); // handle web req to web res
        response4server(res, webRes); //
    })
        .listen(port, () =>
            (
                options?.onListen ||
                (({ hostname, port }) => {
                    console.log(`Listening on http://${hostname}:${port}`);
                })
            )({ hostname: "localhost", port })
        )
        .on("error", (e) => options?.onError?.(e));
}

/**
 * transform node.js's http incoming message to web Request
 * @param req node.js http.IncomingMessage
 * @returns web Request
 */
function incoming2request(req: http.IncomingMessage): Request {
    const method = req.method ?? "GET";
    let body: ReadableStream | undefined = undefined;
    if (!["HEAD", "GET"].includes(method.toUpperCase())) {
        const ds = new Duplex();
        req.pipe(ds);
        body = Duplex.toWeb(ds) as ReadableStream;
    }
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
        if (Array.isArray(value)) {
            value.forEach((v) => headers.append(key, v));
        } else {
            headers.append(key, value ?? "");
        }
    }

    if (!req.url) req.url = "/";
    if (!req.headers.host) throw new Error("the headers 'Host' is unset");

    return new Request(new URL(req.url, `http://${req.headers.host}`), {
        method,
        headers,
        body,
    });
}

/**
 * response to node.js's http server response with web Response
 * @param res  node.js http.ServerResponse
 * @param resp web Response
 */
function response4server(res: http.ServerResponse, resp: Response) {
    res.statusCode = resp.status;
    resp.headers.forEach(([key, value]) => {
        if (res.hasHeader(key)) {
            res.setHeader(key, [res.getHeader(key)!, value].map(String).flat());
        } else {
            res.setHeader(key, value);
        }
    });
    if (resp.body) {
        // const ds = Duplex.fromWeb(resp.body as Parameters<typeof Duplex.fromWeb>[0]);
        // ds.pipe(res);
        resp.arrayBuffer().then((ab) => res.end(Buffer.from(ab)));
    } else {
        res.end();
    }
}

// serve((req) => new Response("hello,world!"));
