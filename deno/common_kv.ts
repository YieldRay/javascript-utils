import type { Client } from "npm:@libsql/client";

interface Kv {
    get<T = unknown>(key: string[]): Promise<T | null>;
    set(key: string[], value: unknown): Promise<boolean>;
    list<T = unknown>(prefix: string[]): Promise<Array<T>>;
}

export class KvDeno implements Kv {
    denoKv: Deno.Kv;
    constructor(kv: Deno.Kv) {
        this.denoKv = kv;
    }

    async get<T = unknown>(key: string[]): Promise<T | null> {
        const { value } = await this.denoKv.get<T>(key);
        return value;
    }

    async set(key: string[], value: unknown): Promise<boolean> {
        const { ok } = await this.denoKv.set(key, value);
        return ok;
    }

    async list<T = unknown>(prefix: string[]): Promise<T[]> {
        const it = this.denoKv.list<T>({ prefix });
        return (await Array.fromAsync(it)).map(({ value }) => value);
    }
}

/**
 * Simulate kv with sqlite, which is slow, but just works
 *
 * @param client `import("@libsql/client").createClient()`
 * @param tableName this table should be managed by kv
 */
export class KvLibsql implements Kv {
    MAX_KEY_LENGTH = 9 as const;
    client: Client;
    tableName: string;

    constructor(client: Client, tableName: string) {
        this.client = client;
        this.tableName = tableName;
        client.execute(/*sql*/ `CREATE TABLE IF NOT EXISTS "${tableName}" (
            "0" TEXT NOT NULL,
            "1" TEXT,
            "2" TEXT,
            "3" TEXT,
            "4" TEXT,
            "5" TEXT,
            "6" TEXT,
            "7" TEXT,
            "8" TEXT,
            "data" TEXT
        )`);
    }

    async set(key: string[], value: unknown): Promise<boolean> {
        const where = new Array(this.MAX_KEY_LENGTH)
            .fill(undefined)
            .map((_, i) => (i in key ? `"${i}"=?` : `"${i}" IS NULL`))
            .join(" AND ");

        const existsRs = await this.client.execute({
            sql: /*sql*/ `SELECT count(*) FROM ${this.tableName} WHERE ${where}`,
            args: key,
        });

        if ((existsRs.rows[0]["count(*)"] as number) > 0) {
            // delete old one
            await this.client.execute({
                sql: /*sql*/ `DELETE FROM ${this.tableName} WHERE ${where}`,
                args: key,
            });
        }

        const rs = await this.client.execute({
            sql: /*sql*/ `INSERT INTO ${this.tableName} VALUES (${new Array(this.MAX_KEY_LENGTH + 1)
                .fill("?")
                .join(",")})`,
            args: [...new Array(this.MAX_KEY_LENGTH).fill(null).map((_, i) => key[i] ?? null), JSON.stringify(value)],
        });

        return rs.rowsAffected === 1;
    }

    async get<T = unknown>(key: string[]): Promise<T | null> {
        const sql = /*sql*/ `SELECT data FROM ${this.tableName} 
        WHERE ${new Array(key.length)
            .fill(undefined)
            .map((_, i) => `"${i}"=?`)
            .join(" AND ")} LIMIT 1`;

        const rs = await this.client.execute({
            sql,
            args: key,
        });

        if (rs.rows.length > 0) return JSON.parse(rs.rows[0].data as string);
        return null;
    }

    async list<T = unknown>(prefix: string[]): Promise<T[]> {
        const sql = /*sql*/ `SELECT data FROM ${this.tableName} 
        WHERE ${new Array(prefix.length)
            .fill(undefined)
            .map((_, i) => `"${i}"=?`)
            .join(" AND ")}`;

        const rs = await this.client.execute({
            sql,
            args: prefix,
        });

        return rs.rows.map((row) => JSON.parse(row.data as string));
    }
}
