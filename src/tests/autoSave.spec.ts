import { autoSave, dirtyStore } from "$lib"
import { writable } from "svelte/store";

describe('autoSave', () => {
    let dirty = dirtyStore();
    let value = writable(0);

    it('saves when dirty after delay', async () => {
        let saved = 0;
        const autoUnsub = autoSave(() => { ++saved }, dirty, value, { delay: 1 });

        expect(saved).toEqual(0);
        value.set(1);
        dirty.chainLink.writer(1);
        expect(saved).toEqual(0);

        await delay(10);
        expect(saved).toEqual(1);

        autoUnsub();
    })

    it('saves when destroying', async () => {
        let saved = 0;
        const autoUnsub = autoSave(() => { ++saved }, dirty, value, { delay: 50000 });

        expect(saved).toEqual(0);
        value.set(2);
        dirty.chainLink.writer(2);
        expect(saved).toEqual(0);

        autoUnsub();

        expect(saved).toEqual(1);
    })

    function delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
})