import type { Readable } from "svelte/store";
import { writable } from "svelte/store";
import type { ChainLink } from "./chainStore"

export interface DirtyStore extends Readable<boolean> {
    reset(): void;
    chainLink: ChainLink;
}

export const dirtyStore = (): DirtyStore => {

    let startHash: number;
    let lastHash: number;

    const { set, subscribe } = writable(false);

    function hash(value: any) {
        if (value === null || value === undefined) return value;
        switch (typeof value) {
            case 'number':
            case 'boolean':
                return value;
            case 'string':
                return hashCode(value);
            default:
                return hashCode(JSON.stringify(value));
        }
    }

    function hashCode(s: string): number {
        let h: number;
        for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
        return h;
    }

    function triggerSet() {
        set(lastHash !== startHash);
    }

    function writer(val: any): any {
        lastHash = hash(val);
        triggerSet();
        return val;
    }

    function reader(val: any): any {
        lastHash = hash(val);
        reset();
        return val;
    }

    function reset() {
        startHash = lastHash;
        triggerSet();
    }


    return {
        subscribe,
        reset,

        chainLink: {
            reader,
            writer
        }
    }
}