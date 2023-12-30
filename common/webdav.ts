export function propfind(files: Record<string, { contentlength?: number; lastmodified?: Date }>, prefix = "/") {
    const multistatus = Object.entries(files)
        .map(([name, { contentlength, lastmodified }]) => {
            const href =
                prefix + (name.endsWith("/") ? encodeURIComponent(name.slice(0, -1)) + "/" : encodeURIComponent(name));
            return /*xml*/ `    <d:response>
        <d:href>${href}</d:href>
        <d:propstat>
            <d:prop>
                <d:displayname>${name.replace(/\/$/, "")}</d:displayname>
                <d:getcontentlength>${contentlength ?? 0}</d:getcontentlength>${
                lastmodified
                    ? /*xml*/ `
                <d:getlastmodified>${lastmodified.toUTCString()}</d:getlastmodified>
`
                    : ""
            }
            </d:prop>
            <d:status>HTTP/1.1 200 OK</d:status>
        </d:propstat>
    </d:response>`;
        })
        .join("\n");

    return /*xml*/ `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<d:multistatus xmlns:d="DAV:">
${multistatus}
</d:multistatus>`;
}
