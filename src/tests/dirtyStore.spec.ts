import { get } from 'svelte/store';
import { dirtyStore } from "$lib";

describe('dirtyStore', () => {

    it('starts as not dirty', () => {
        const store = dirtyStore();
        expect(get(store)).toEqual(false);
    })

    it('dirty after value changes', () => {
        const store = dirtyStore();
        expect(get(store)).toEqual(false);
        store.chainLink.writer(1);
        expect(get(store)).toEqual(true);
        store.chainLink.writer(2);
    })

    it('not dirty after reset', () => {
        const store = dirtyStore();
        expect(get(store)).toEqual(false);
        store.chainLink.writer('A');
        expect(get(store)).toEqual(true);
        store.chainLink.writer('B');
        store.reset();
        expect(get(store)).toEqual(false);
    })

    it('not dirty if value changes back to original value', () => {
        const store = dirtyStore();
        expect(get(store)).toEqual(false);
        store.chainLink.writer('A');
        expect(get(store)).toEqual(true);
        store.reset();
        expect(get(store)).toEqual(false);
        store.chainLink.writer('B');
        expect(get(store)).toEqual(true);
        store.chainLink.writer('A');
        expect(get(store)).toEqual(false);
    })

    it('supports primitive types', () => {
        const store = dirtyStore();
        expect(get(store)).toEqual(false);

        //Make sure value is reset to something random (not undefined!)
        store.chainLink.writer('dummy');
        store.reset();
        expect(get(store)).toEqual(false);

        store.chainLink.writer(true);
        expect(get(store)).toEqual(true);
        store.chainLink.writer(false);
        expect(get(store)).toEqual(true);
        store.chainLink.writer(0);
        expect(get(store)).toEqual(true);
        store.chainLink.writer(1);
        expect(get(store)).toEqual(true);
        store.chainLink.writer('a string');
        expect(get(store)).toEqual(true);
        store.chainLink.writer({ test: 'A more complex object' });
        expect(get(store)).toEqual(true);
        store.chainLink.writer(null);
        expect(get(store)).toEqual(true);
        store.chainLink.writer(undefined);
        expect(get(store)).toEqual(true);
    })

    it('null is not equal to undefined', () => {
        const store = dirtyStore();
        store.chainLink.writer(null);
        store.reset();
        expect(get(store)).toEqual(false);
        store.chainLink.writer(undefined);
        expect(get(store)).toEqual(true);
        store.chainLink.writer(null);
        expect(get(store)).toEqual(false);
    })

    it('undefined is not equal to null', () => {
        const store = dirtyStore();
        store.chainLink.writer(undefined);
        store.reset();
        expect(get(store)).toEqual(false);
        store.chainLink.writer(null);
        expect(get(store)).toEqual(true);
        store.chainLink.writer(undefined);
        expect(get(store)).toEqual(false);
    })

    it('reader also resets', () => {
        const store = dirtyStore();
        expect(get(store)).toEqual(false);

        const value1 = { v: 123 };
        const res1 = store.chainLink.reader(value1);
        expect(res1).toHaveProperty('v');
        expect(res1.v).toEqual(123);
        expect(get(store)).toEqual(false);

        store.chainLink.writer({ v: 456 });
        expect(get(store)).toEqual(true);

        store.chainLink.writer({ v: 123 });
        expect(get(store)).toEqual(false);
    })
})
