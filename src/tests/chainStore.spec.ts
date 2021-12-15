import { chain, jsonChainLink } from "$lib";
import { readable, writable } from "svelte/store";

describe('chainStore', () => {
    it('writes in expected order', () => {
        const chainRef = chain((v) => v + 2).chain(v => v * 3);
        expect(chainRef.write(2)).toEqual((2 + 2) * 3);
    })

    it('reads in expected order', () => {
        const chainRef = chain(null, (v) => v * 3).chain(null, v => v + 2).chain(null, v => 2);
        expect(chainRef.read(0)).toEqual((2 + 2) * 3);
    })

    it('default value passed to read chain by last read function', () => {
        let counter = 0; const startValue = 2;
        const chainRef = chain(null, v => { ++counter; return v; }).chain(null, (v) => v * 3).chain(null, v => v + 2).chain(null, v => v);

        expect(chainRef.read(startValue)).toEqual((startValue + 2) * 3);
        expect(counter).toEqual(1);
    })

    it('empty readers queue should return default value', () => {
        const chainRef = chain(null);
        expect(chainRef.read(9)).toEqual(9);
    })

    it('initalizes store with the default value', () => {
        let storeVal;
        const defVal = { a: 123 };
        const chainRef = chain(null, null).sync().store(defVal);
        chainRef.subscribe((v) => storeVal = v)
        expect(storeVal).toEqual(defVal);
    })

    it('returns same value if writer list is empty', () => {
        const chainRef = chain(null, null);
        const res = chainRef.write(123);
        expect(res).toEqual(123);
    })

    it('returns same value if reader list is empty', () => {
        const chainRef = chain(null, null);
        const res = chainRef.read(123);
        expect(res).toEqual(123);
    })

    it('can call sync() only once', () => {
        expect(() => chain(v => v).sync().sync()).toThrow();
    })

    it('sync() must be called before store()', () => {
        const chainRef = chain(v => v);
        chainRef.store(1);
        expect(() => chainRef.sync()).toThrow();
    })

    it('can call store() only once', () => {
        const chainRef = chain(v => v);
        chainRef.store(1);
        expect(() => chainRef.store(1)).toThrow();
    })

    it('can call store(storeRef) only once', () => {
        const testStore = writable(1);
        const chainRef = chain(v => v);
        chainRef.store(testStore);
        expect(() => chainRef.store(testStore)).toThrow();
    })

    it('can only use writable store if sync is in the chain', () => {
        const chainRef = chain(v => v).sync()
        expect(() => chainRef.store(readable(1))).toThrow();
    })

    it('can use readable store if sync is NOT in the chain', () => {
        const chainRef = chain(v => v);
        expect(() => chainRef.store(readable(1))).not.toThrow();
    })

    it('syncs data back to store and continues down chain', () => {
        let storeVal = 0;
        let finalValue = 0;
        let counter = 0;
        const store = chain((v) => v + 2).chain(v => v * 3).sync().chain(v => v - 7).chain<number>(v => { finalValue = v; return v; }).store(-1);
        store.subscribe(v => { storeVal = v; ++counter; })
        expect(storeVal).toEqual(-1);
        expect(counter).toEqual(1);

        const startVal = 2;
        store.set(startVal);
        expect(storeVal).toEqual((startVal + 2) * 3);
        expect(finalValue).toEqual(((startVal + 2) * 3) - 7);
        expect(counter).toEqual(2); //Chain must only trigger subscribe once more
    })

    it('chain reacts to changes in store', () => {
        let storeVal = 0;
        let counter = 0;
        let finalValue = 0;

        const store = writable(-1);
        store.subscribe(v => { storeVal = v; ++counter; })

        chain((v) => v + 2).chain(v => v * 3).sync().chain(v => v - 7).chain<number>(v => { finalValue = v; return v; }).store(store);

        expect(storeVal).toEqual(-1);
        expect(counter).toEqual(1);

        const startVal = 2;
        store.set(startVal);
        expect(storeVal).toEqual((startVal + 2) * 3);
        expect(finalValue).toEqual(((startVal + 2) * 3) - 7);
        expect(counter).toEqual(2); //Chain must only trigger subscribe once more
    })

    it('chain can load chainlink', () => {
        const chainRef = chain(jsonChainLink()).chain(null, v => '2');
        expect(chainRef.write(1)).toEqual('1');
        expect(chainRef.read(0)).toEqual(2);
    })

    it('emitting falsy boolean value should not skip read chain', () => {
        let counter = 0;
        const chainRef = chain(null, v => !v).chain(null, v => { ++counter; return v; }).chain(null, v => false);
        expect(chainRef.read('badvalue')).toEqual(true);
        expect(counter).toEqual(1);

    })

    it('emitting falsy number value should not skip read chain', () => {
        let counter = 0;
        const chainRef = chain(null, v => ++v).chain(null, v => { ++counter; return v; }).chain(null, v => 0);
        expect(chainRef.read('badvalue')).toEqual(1);
        expect(counter).toEqual(1);
    })

    it('does not overwrite store with initial value if readers are empty', () => {
        let storeVal = 0;
        const store = writable(1);
        store.subscribe(v => storeVal = v);
        expect(storeVal).toEqual(1);
        chain(v => v).store(store);
        expect(storeVal).toEqual(1);
    })

    it('does not overwrite store with initial value if store is only readable, but execute read queue once', () => {
        let storeVal = 0;
        let counter = 0;
        const store = readable(99);
        store.subscribe(v => storeVal = v);
        expect(storeVal).toEqual(99);
        chain(v => v, v => ++counter).store(store);
        expect(storeVal).toEqual(99);
        expect(counter).toEqual(1);
    })

    it('attached store reads once, writes zero times on initialize', () => {
        let storeVal = 0;
        let readCounter = 0;
        let writeCounter = 0;
        let storeCounter = 0;

        const store = writable(-1);
        store.subscribe(v => { storeVal = v; ++storeCounter; })

        chain(v => { ++writeCounter; return --v }, v => { ++readCounter; return ++v }).store(store, 99);
        expect(storeVal).toEqual(100);
        expect(storeCounter).toEqual(2);
        expect(readCounter).toEqual(1);
        expect(writeCounter).toEqual(0);

        store.set(88);
        expect(storeVal).toEqual(88);
        expect(storeCounter).toEqual(3);
        expect(readCounter).toEqual(1);
        expect(writeCounter).toEqual(1);
    })

    it('attached store reads once, writes zero times on initialize (with sync)', () => {
        let storeVal = 0;
        let readCounter = 0;
        let writeCounter = 0;
        let storeCounter = 0;

        const store = writable(-1);
        store.subscribe(v => { storeVal = v; ++storeCounter; })

        chain(v => { ++writeCounter; return --v }, v => { ++readCounter; return ++v }).sync().store(store, 99);
        expect(storeVal).toEqual(100);
        expect(storeCounter).toEqual(2);
        expect(readCounter).toEqual(1);
        expect(writeCounter).toEqual(0);

        store.set(88);
        expect(storeVal).toEqual(87);
        expect(storeCounter).toEqual(3);
        expect(readCounter).toEqual(1);
        expect(writeCounter).toEqual(1);
    })
})