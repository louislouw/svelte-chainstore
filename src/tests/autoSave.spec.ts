import { autoSave, dirtyStore } from "$lib"
import { writable } from "svelte/store";

describe('autoSave', () => {
    let dirty = dirtyStore();
    let value = writable(0);

    it('saves when dirty after delay', async () => {
        let saved = 0;
        const autoUnsub = autoSave(() => { ++saved }, dirty, value, { delay: 1 });

        expect(saved).toEqual(0);
        setValue(1);
        expect(saved).toEqual(0);

        await delay(10);
        expect(saved).toEqual(1);

        autoUnsub();
    })

    it('saves when destroying', async () => {
        let saved = 0;
        const autoUnsub = autoSave(() => { ++saved }, dirty, value, { delay: 50000 });

        expect(saved).toEqual(0);
        setValue(2);
        expect(saved).toEqual(0);

        autoUnsub();

        expect(saved).toEqual(1);
    })

    it('does not save if value did not change', async () => {
        let saved = 0;
        const autoUnsub = autoSave(() => { ++saved }, dirty, value, { delay: 10 });
        setValue(3);
        dirty.reset();
        expect(saved).toEqual(0);

        setValue(2);
        expect(saved).toEqual(0); //Race: should still be zero
        setValue(3);
        expect(saved).toEqual(0); //Race: should still be zero

        await delay(20);
        expect(saved).toEqual(0); //Should still be zero as value wont be dirty

        autoUnsub();
    })

    function setValue(val: any) {
        value.set(val);
        dirty.chainLink.writer(val);
    }

    function delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
})