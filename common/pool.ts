/**
 * use EventTarget & CustomEvent
 * need polyfill in node.js!
 */

type TaskStatus = "unstarted" | "pending" | "fulfilled" | "rejected";

type LabeledTask<T> = {
    status: TaskStatus;
    task: () => Promise<T>;
};

/**
 * for making addEventListener() & removeEventListener() have type hints
 */
class NamedEventTarget<T extends string = string> extends EventTarget {
    addEventListener(
        type: T,
        listener: EventListenerOrEventListenerObject | null,
        options?: boolean | AddEventListenerOptions
    ): void {
        super.addEventListener(type, listener, options);
    }
    removeEventListener(
        type: T,
        callback: EventListenerOrEventListenerObject | null,
        options?: boolean | EventListenerOptions
    ): void {
        super.removeEventListener(type, callback, options);
    }
}

/**
 * a task pool that allows limit count of task to run concurrently
 */
export class TaskPool<T = any> extends NamedEventTarget<Exclude<TaskStatus, "unstarted">> {
    #poolLimit: number;
    #pool: LabeledTask<T>[] = [];
    #isRunning = false;

    constructor(poolLimit: number) {
        super();
        if (poolLimit <= 0) throw new Error(`poolLimit should be more than zero, receive ${poolLimit}`);
        this.#poolLimit = poolLimit;
    }

    submit(...tasks: (() => Promise<T>)[]) {
        for (const task of tasks) {
            this.#pool.push({
                status: "unstarted",
                task: () =>
                    new Promise<T>((resolve, reject) => {
                        const promise = task();
                        if (isPromise(promise))
                            promise.then((fulfillment) => resolve(fulfillment)).catch((rejection) => reject(rejection));
                        // if not a promise, simply call resolve()
                        else resolve(promise);
                    }),
            });
        }
        // start promise
        this.#do();
    }

    async #do() {
        // lock
        if (this.#isRunning) return;
        this.#isRunning = true;

        const getUnstarted = () => this.#pool.filter((e) => e.status === "unstarted");
        const getPending = () => this.#pool.filter((e) => e.status === "pending");

        while (getUnstarted().length > 0) {
            const labeledTasks = getUnstarted().slice(0, this.#poolLimit - getPending().length);

            const raceList = labeledTasks.map((labeledTask) => {
                const dispatchEvent = (status: TaskStatus, detail: any) => {
                    labeledTask.status = status;
                    // this.#pool.find((e) => e.id === id)!.status = status;
                    this.dispatchEvent(new CustomEvent(status, { detail }));
                };

                const promise = labeledTask.task();
                dispatchEvent("pending", promise);

                return promise
                    .then((data) => {
                        dispatchEvent("fulfilled", data);
                    })
                    .catch((data) => {
                        dispatchEvent("rejected", data);
                    });
            });

            await Promise.race(raceList);
        }

        // release lock
        this.#isRunning = false;
    }
}

/**
 * we need standard Promise, rather than PromiseLike
 */
function isPromise<T>(obj: unknown): obj is Promise<T> {
    return Object.prototype.toString.call(obj).slice(8, -1) === "Promise";
}
