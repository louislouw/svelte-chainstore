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

    it('read returns default if store returns null', () => {
        let counter = 0;
        const chainRef = chain(null, v => { ++counter; return v; }).chain(null, (v) => v * 3).chain(null, v => v + 2).chain(null, v => null);
        expect(chainRef.read(99)).toEqual(99); //Note: This skips entire read chain
        expect(counter).toEqual(0);
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
})