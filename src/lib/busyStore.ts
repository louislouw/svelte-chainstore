import type { Readable } from 'svelte/store';
import { writable } from "svelte/store";

interface BusyReadable<T extends boolean> extends Readable<T> {
    run(this: void, callback: CallableFunction): Promise<any> | any;
}

export const busyStore = (startBusy: boolean = false): BusyReadable<boolean> => {
    let nesting = 0;

    const { subscribe, set } = writable<boolean>(startBusy);

    const enter = () => {
        nesting++;
        set(nesting !== 0);
    };

    const leave = () => {
        nesting--;
        set(nesting !== 0);
    };

    const run = (callback: CallableFunction): Promise<any> | any => {
        try {
            enter();
            const res = callback();
            if (res instanceof Promise) {
                enter();
                res.finally(leave);
            }
            return res;
        } finally {
            leave();
        }
    };

    return {
        subscribe,
        run
    };
};