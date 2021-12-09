import type { BusyReadable } from "$lib/busyStore";
import { busyStore } from "$lib";

describe('busyStore initialization', () => {

    it('default starts as not busy', () => {
        const busyValue = getBusyValue(busyStore());
        expect(busyValue).toEqual(false);
    })

    it('starts as not busy', () => {
        const busyValue = getBusyValue(busyStore(false));
        expect(busyValue).toEqual(false);
    })

    it('starts as busy', () => {
        const busyValue = getBusyValue(busyStore(true));
        expect(busyValue).toEqual(true);
    })

    it('starts as busy, but ends as not busy after run', () => {
        const store = busyStore(true);
        expect(getBusyValue(store)).toEqual(true);
        store.run(() => false);
        expect(getBusyValue(store)).toEqual(false);
    })

    function getBusyValue(store: BusyReadable<boolean>): boolean {
        let busyval = false;
        const usub = store.subscribe((v) => busyval = v);
        usub();
        return busyval;
    }
});

describe('busyStore nested', () => {
    const store = busyStore();
    let busyVal = false;
    store.subscribe(v => busyVal = v);

    function level2() {
        store.run(() => {
            expect(busyVal).toEqual(true);
        })
    }

    it('busy is true, even in nested case', () => {
        expect(busyVal).toEqual(false);
        store.run(() => {
            expect(busyVal).toEqual(true);
            level2();
            expect(busyVal).toEqual(true);
            level2();
            expect(busyVal).toEqual(true);
        })
        expect(busyVal).toEqual(false);
    })

    it('should not be busy between non-nested runs', () => {
        expect(busyVal).toEqual(false);
        level2();
        expect(busyVal).toEqual(false);
        level2();
        expect(busyVal).toEqual(false);
    })
});

describe('busyStore promises', () => {
    it('is busy while promise being resolved', async () => {
        const store = busyStore();
        let busyVal = false;
        store.subscribe(v => busyVal = v);

        expect(busyVal).toEqual(false);
        let promise = store.run(async () => await delay(10))
        expect(busyVal).toEqual(true); //A bit of a race condition, but 10ms should be enough
        await promise;
        expect(busyVal).toEqual(false);
    })

    function delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
})


describe('busyStore becomes false even on error', () => {
    const store = busyStore();
    let busyVal = false;
    store.subscribe(v => busyVal = v);

    function normalError() {
        expect(busyVal).toEqual(true);
        throw new Error('Normal error');
    }

    async function promiseError() {
        expect(busyVal).toEqual(true);
        throw new Error('Promise error');
    }

    it('busy becomes false even after error', () => {
        expect(busyVal).toEqual(false);
        expect(() => store.run(normalError)).toThrow();
        expect(busyVal).toEqual(false);
    })

    it('busy becomes false even after error inside promise', async () => {
        expect(busyVal).toEqual(false);
        try {
            await store.run(promiseError);
            expect(false).toEqual(true); //Should never get here
        } catch (e) {
            expect(e).toBeTruthy();
            expect(e.message).toEqual('Promise error');
        }
        expect(busyVal).toEqual(false);
    })

});