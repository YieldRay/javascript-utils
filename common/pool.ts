/**
 * use EventTarget & CustomEvent
 * need polyfill in node.js!
 */

type TaskStatus = "pending" | "fulfilled" | "rejected";

type LabeledPromise<T, ID extends number = number> = {
    id: ID;
    status: TaskStatus;
    task: Promise<{ id: ID; value: T }>;
};

export class PoolResolveEvent<T> extends CustomEvent<T> {
    constructor(detail: T) {
        super("resolve", { detail });
    }
}

export class PoolRejectEvent<T> extends CustomEvent<T> {
    constructor(detail: T) {
        super("reject", { detail });
    }
}

/**
 * for making addEventListener() & removeEventListener() have type hints
 */
class NamedEventTarget<T extends string = string> extends EventTarget {
    addEventListener(
        type: T,
        listener: EventListenerOrEventListenerObject | null,
        options?: boolean | AddEventListenerOptions | undefined
    ): void {
        super.addEventListener(type, listener, options);
    }
    removeEventListener(
        type: T,
        callback: EventListenerOrEventListenerObject | null,
        options?: boolean | EventListenerOptions | undefined
    ): void {
        super.removeEventListener(type, callback, options);
    }
}

export class TaskPool<T = any> extends NamedEventTarget<"resolve" | "reject"> {
    #poolLimit: number;
    #pool: LabeledPromise<T>[] = [];
    #count = 0; // for id
    #isRunning = false;

    get #pending() {
        return this.#pool.filter((e) => e.status === "pending");
    }

    constructor(poolLimit: number = 2) {
        super();
        this.#poolLimit = poolLimit;
    }

    submit(...tasks: Promise<T>[]) {
        // when submit, add unique id for finding
        for (const task of tasks) {
            const id = this.#count++;
            this.#pool.push({
                id,
                status: "pending",
                task: new Promise<{ id: number; value: T }>((resolve, reject) => {
                    task.then((fulfillment) => resolve({ id, value: fulfillment })).catch((rejection) =>
                        reject({ id, value: rejection })
                    );
                }),
            });
        }
        // start promise
        setTimeout(() => this.#do(), 0);
    }

    async #do() {
        // lock
        if (this.#isRunning) return;
        this.#isRunning = true;

        while (this.#pending.length > 0) {
            const labeledTasks = this.#pending.slice(0, this.#poolLimit).map((e) => e.task);

            await Promise.race(labeledTasks)
                .then(({ id, value }) => {
                    // change state
                    this.#pool.find((e) => e.id === id)!.status = "fulfilled";
                    // event
                    this.dispatchEvent(new PoolResolveEvent(value));
                })
                .catch(({ id, value }) => {
                    // change state
                    this.#pool.find((e) => e.id === id)!.status = "rejected";
                    // event
                    this.dispatchEvent(new PoolRejectEvent(value));
                });
        }

        // release lock
        this.#isRunning = false;
    }
}
