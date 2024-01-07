import { type Config, createClient } from "npm:@libsql/client";

export interface Options extends Config {
    table?: string;
}

/**
 * @param options based on the libsql client
 * @warn we always use the client time, NEVER use time of the database
 * @ref https://docs.turso.tech/libsql/client-access/javascript-typescript-sdk
 * @example
 * ```js
 * const kv = await createKV({
 *     // By default is "kv", you can set to your favorite table name
 *     table: "myKV",
 *     // Connect to local sqlite file
 *     url: "file:local.db",
 *     // Or connect to libsql server
 *     url: "libsql://your-database.turso.io",
 *     authToken: "your-auth-token",
 * });
 * ```
 */
export async function createKV(options: Options) {
    const client = createClient(options);
    const tableName = options.table || "kv";
    /**
     * In this table, we store time as timestamp number in milliseconds
     */
    await client.executeMultiple(`CREATE TABLE IF NOT EXISTS "${tableName}" (
        "key" TEXT PRIMARY KEY,
        "value" TEXT,
        "type" TEXT CHECK(type IN ('undefined', 'object', 'boolean', 'number', 'bigint', 'string')),
        "updatedAt" INTEGER NOT NULL,
        "expiredAt" INTEGER NULL
    );
        DELETE FROM ${tableName} WHERE "expiredAt" < ${Date.now()};
    `);

    /**
     * Set a kv to table, note that expiredAt and any other time value is always the client time,
     * rather that the sql server time.
     * Returns 1 when success, or 0 when fail
     */
    async function set<T = any>(key: string, val: T, expiredAt?: Date | number) {
        const { type, value } = toTypedValue(val);
        const rs = await client.execute({
            sql: `INSERT OR REPLACE INTO "${tableName}" (key, value, type, expiredAt, updatedAt) VALUES (?,?,?,?,?)`,
            args: [
                key,
                value,
                type,
                typeof expiredAt === "number" || expiredAt instanceof Date ? new Date(expiredAt).getTime() : null,
                Date.now(),
            ],
        });
        return rs.rowsAffected;
    }

    /**
     * Get the value in javascript
     */
    async function get<T = any>(key: string): Promise<T | undefined> {
        const rs = await client.execute({
            sql: `SELECT value,type FROM "${tableName}" WHERE key=?`,
            args: [key],
        });
        const { rows } = rs;
        if (rows.length === 0) return undefined;
        const row = rows[0];
        const { value, type } = row;
        return fromTypedValue({ value, type } as TypedValue);
    }

    /**
     * Check if key already exists
     */
    async function has(key: string) {
        const rs = await client.execute({
            sql: `SELECT count(*) FROM "${tableName}" WHERE key=?`,
            args: [key],
        });
        const { rows } = rs;
        if (rows.length === 0) return false;
        const row = rows[0];
        const count = Object.values(row)[0] as number;
        return count > 0;
    }

    /**
     * Get the detailed value (with extra info)
     */
    async function getDetailed<T = any>(key: string) {
        const rs = await client.execute({
            sql: `SELECT value,type,updatedAt,expiredAt FROM "${tableName}" WHERE key=?`,
            args: [key],
        });
        const { rows } = rs;
        if (rows.length === 0) return undefined;
        const row = rows[0];

        const { value, type, updatedAt, expiredAt } = row;
        if (typeof updatedAt !== "number") throw new Error(`Row is broken`);

        return {
            value: fromTypedValue<T>({ type, value } as TypedValue),
            updatedAt: new Date(updatedAt),
            expiredAt: typeof expiredAt === "number" ? new Date(expiredAt) : null,
        };
    }

    /**
     * Returns 1 when success, or 0 when fail
     */
    async function delete$(key: string) {
        const rs = await client.execute({
            sql: `DELETE FROM "${tableName}" WHERE key=?`,
            args: [key],
        });
        return rs.rowsAffected;
    }

    /**
     * Returns the count of deleted key
     */
    async function dropExpired() {
        const rs = await client.execute(`DELETE FROM "${tableName}" WHERE expiredAt < CURRENT_TIMESTAMP`);
        return rs.rowsAffected;
    }

    /**
     * Shortcut to REMOVE the entire table, make sure you known what you are doing!
     */
    async function dropTable() {
        await client.execute(`DROP TABLE "${tableName}"`);
    }

    /**
     * Clear the table and return the count of the cleared row
     */
    async function clear() {
        const rs = await client.execute(`DELETE FROM "${tableName}"`);
        return rs.rowsAffected;
    }

    /**
     * List all the key name
     */
    async function list() {
        const rs = await client.execute(`SELECT key FROM "${tableName}"`);
        return rs.rows.map((row) => row.key);
    }

    /**
     * List all the key name and it's extra info (not include the value)
     */
    async function listDetailed() {
        const rs = await client.execute(`SELECT key,updatedAt,expiredAt FROM "${tableName}"`);
        return rs.rows.map((row) => {
            const { key, updatedAt, expiredAt } = row;
            if (typeof updatedAt !== "number") throw new Error(`Row is broken`);
            return {
                key: key as string,
                updatedAt: new Date(updatedAt),
                expiredAt: typeof expiredAt === "number" ? new Date(expiredAt) : null,
            };
        });
    }

    return { get, set, has, clear, list, delete: delete$, dropExpired, dropTable, getDetailed, listDetailed, client };
}

/**
 * Our sql value, simply a string value with its type
 */
interface TypedValue {
    type: "undefined" | "object" | "boolean" | "number" | "bigint" | "string";
    value: string;
}

/**
 * Convert the javascript table to our sql value
 */
function toTypedValue<T = any>(val: T): TypedValue {
    let value: string;
    let type: TypedValue["type"];
    switch (typeof val) {
        case "undefined":
            type = "undefined";
            value = "";
            break;
        case "object":
            type = "object";
            value = JSON.stringify(val);
            break;
        case "boolean":
            type = "boolean";
            value = String(val);
            break;
        case "number":
            type = "number";
            value = String(val);
            break;
        case "bigint":
            type = "bigint";
            value = String(val);
            break;
        case "string":
            type = "string";
            value = val;
            break;
        default:
            throw new Error(`Cannot set ${val} of type ${typeof val}`);
    }
    return { type, value };
}

/**
 * Convert our sql value into javascript value
 */
function fromTypedValue<T = any>(tv: TypedValue): T {
    const { type, value } = tv;
    switch (type) {
        case "undefined":
            return undefined as T;
        case "object":
            return JSON.parse(value as string) as T;
        case "boolean":
            if (value === "true") return true as T;
            if (value === "false") return false as T;
            throw new Error("Row is broken");
        case "number":
            return Number(value) as T;
        case "bigint":
            return BigInt(value as string) as T;
        case "string":
            return value as T;
        default:
            throw new Error(`Row is broken`);
    }
}