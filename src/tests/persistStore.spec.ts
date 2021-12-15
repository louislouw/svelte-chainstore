import { persistStore } from "$lib/persistStore";
import { storageMock } from "./storageMock";

describe('persistStore', () => {

    const storageEmulator = storageMock();

    it('returns default if not yet set', () => {
        const key = 'testPersist';
        storageEmulator.clear();
        expect(storageEmulator.getItem(key)).toEqual(null);

        const store = persistStore(key, 123, storageEmulator);
        let storeVal;
        store.subscribe(v => storeVal = v);
        expect(storeVal).toEqual(123);
        expect(storageEmulator.getItem(key)).toEqual(null);
    })

    it('reads previously written value', () => {
        const key = 'testPersist';
        storageEmulator.clear();
        expect(storageEmulator.getItem(key)).toEqual(null);

        const store = persistStore(key, { a: 123 }, storageEmulator);
        let storeVal;
        store.subscribe(v => storeVal = v);
        expect(storeVal).toEqual({ a: 123 });
        expect(storageEmulator.getItem(key)).toEqual(null);

        store.set('abc');
        expect(storeVal).toEqual('abc');
        expect(storageEmulator.getItem(key)).toEqual(JSON.stringify('abc'));

        let storeVal2;
        const store2 = persistStore(key, { a: 123 }, storageEmulator);
        store2.subscribe(v => storeVal2 = v);
        expect(storeVal2).toEqual('abc');
    })
})
