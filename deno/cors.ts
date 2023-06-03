import { serve } from "https://deno.land/std@0.185.0/http/server.ts";

function isUrl(url: string): boolean {
    if (!url.startsWith("http://") && !url.startsWith("https://")) return false;
    try {
        new URL(url);
    } catch {
        return false;
    }
    return true;
}

const corsHeaders = new Headers({
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
});

async function handleRequest(req: Request): Promise<Response> {
    const { pathname, search, origin } = new URL(req.url);
    const url = pathname.substring(1) + search;

    // check request
    if (!isUrl(url))
        return new Response(`Usage:
const response = await fetch("${origin}/https://example.net/api");
const json = await response.json();`);

    // handle OPTIONS
    if (req.method.toUpperCase() === "OPTIONS") return new Response(null, { headers: corsHeaders });

    // modify request headers
    const reqHeaders = new Headers(req.headers);
    if (reqHeaders.has("referer")) reqHeaders.set("referer", reqHeaders.get("referer")!.replace(`${origin}/`, ""));

    // request
    const res = await fetch(url, new Request(req, { headers: reqHeaders }));

    // modify response headers
    const resHeaders = new Headers(res.headers);
    for (const [k, v] of corsHeaders.entries()) resHeaders.set(k, v);

    // response
    return new Response(res.body, { ...res, headers: resHeaders });
}

const port = Deno.env.get("PORT") ?? "8123";
serve(handleRequest, { port: Number(port) });
