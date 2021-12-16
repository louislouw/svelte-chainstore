import { persistStore } from "$lib/persistStore";
import { storageMock } from "./storageMock";
import { get } from 'svelte/store';

describe('persistStore', () => {

    const storageEmulator = storageMock();

    it('returns default if not yet set', () => {
        const key = 'testPersist';
        storageEmulator.clear();
        expect(storageEmulator.getItem(key)).toEqual(null);

        const store = persistStore(key, 123, storageEmulator);
        expect(get(store)).toEqual(123);
        expect(storageEmulator.getItem(key)).toEqual(null);
    })

    it('reads previously written value', () => {
        const key = 'testPersist';
        storageEmulator.clear();
        expect(storageEmulator.getItem(key)).toEqual(null);

        const store = persistStore(key, { a: 123 }, storageEmulator);
        expect(get(store)).toEqual({ a: 123 });
        expect(storageEmulator.getItem(key)).toEqual(null);

        store.set('abc');
        expect(get(store)).toEqual('abc');
        expect(storageEmulator.getItem(key)).toEqual(JSON.stringify('abc'));

        const store2 = persistStore(key, { a: 123 }, storageEmulator);
        expect(get(store2)).toEqual('abc');
    })
})
