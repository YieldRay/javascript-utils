import { exportKeyPair, generateRSAKeyPair } from "./key_to_text.ts";
import { importPublicKey, importPrivateKey } from "./key_from_text.ts";
import { signedFetch } from "./signed_fetch.ts";

const { publicKey, privateKey } = await generateRSAKeyPair();
const { publicKey: publicKeyPem, privateKey: privateKeyPem } = await exportKeyPair({ publicKey, privateKey });

Deno.writeTextFileSync("./public.pem", publicKeyPem);
Deno.writeTextFileSync("./private.pem", privateKeyPem);

// const publicKey = await importPublicKey(Deno.readTextFileSync("./public.pem"));
// const privateKey = await importPrivateKey(Deno.readTextFileSync("./private.pem"));

const response = await signedFetch(
    { key: privateKey, keyId: "https://example.net/actor#main-key" },
    // see https://docs.joinmastodon.org/spec/security/#digest
    "https://mastodon.example/users/username/inbox",
    {
        headers: { "content-type": 'application/ld+json; profile="http://www.w3.org/ns/activitystreams"' },
        method: "POST",
        body: JSON.stringify({
            "@context": "https://www.w3.org/ns/activitystreams",
            actor: "https://my.example.com/actor",
            type: "Create",
            object: {
                type: "Note",
                content: "Hello!",
            },
            to: "https://mastodon.example/users/username",
        }),
    }
);
