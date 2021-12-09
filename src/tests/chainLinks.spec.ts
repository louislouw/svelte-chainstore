import { blacklistChainLink, defaultsChainLink, jsonChainLink, noopChainLink, storageChainLink, whitelistChainLink } from "$lib";

describe('noopChainLink', () => {
    const link = noopChainLink();
    it('it does not mutate on write', () => {
        expect(link.writer(1)).toEqual(1);
    })

    it('it does not mutate on read', () => {
        expect(link.reader('A')).toEqual('A');
    })
})


describe('jsonChainLink', () => {
    const link = jsonChainLink();

    it.each`
    input           | output
    ${undefined}    | ${undefined}
    ${null}         | ${'null'}
    ${0}            | ${'0'}
    ${true}         | ${'true'}
    ${false}        | ${'false'}
    ${'A string'}   | ${'"A string"'}
    ${{ a: 123 }}   | ${'{"a":123}'}
    `(`jsonChainLink writes [$input] and expects [$output]`, ({ input, output }) => {
        const res = link.writer(input);
        expect(res).toEqual(output);
    })

    it.each`
    input           | output
    ${undefined}    | ${undefined}
    ${'null'}       | ${null}         
    ${'0'}          | ${0}            
    ${'true'}       | ${true}         
    ${'false'}      | ${false}        
    ${'"A string"'} | ${'A string'}   
    ${'{"a":123}'}  | ${{ a: 123 }}
    `(`jsonChainLink reads [$input] and expects [$output]`, ({ input, output }) => {
        const res = link.reader(input);
        expect(res).toEqual(output);
    })
})

describe('storageChainLink', () => {

    let internalStore = { keyname: null };

    const storageMock = (): Storage => {
        return {
            getItem: (key: string): string | null => internalStore[key],
            setItem: (key: string, value: string): void => { internalStore[key] = value },
            clear: () => { internalStore = { keyname: null } },
            key: (index: number): string | null => Object.keys(internalStore)[index],
            removeItem: (key: string) => { internalStore[key] = null },
            length: Object.keys(internalStore).length
        }
    }

    const storageEmulator = storageMock();
    const link = storageChainLink('keyname', storageEmulator);

    it('Writing null value removes key', () => {
        storageEmulator.clear();
        expect(link.writer('zzz')).toEqual('zzz');
        expect(internalStore.keyname).toEqual('zzz');

        expect(link.writer(null)).toEqual(null);
        expect(internalStore.keyname).toEqual(null);
        expect(link.reader()).toEqual(null);
    })

    it('Writing undefined value removes key', () => {
        storageEmulator.clear();
        expect(link.writer('zzz')).toEqual('zzz');
        expect(internalStore.keyname).toEqual('zzz');

        expect(link.writer(undefined)).toEqual(undefined);
        expect(internalStore.keyname).toEqual(null);
        expect(link.reader()).toEqual(null);
    })

    it('Writer writes value into storage', () => {
        storageEmulator.clear();
        expect(internalStore.keyname).not.toEqual('abc');
        expect(link.writer('abc')).toEqual('abc');
        expect(internalStore.keyname).toEqual('abc');
    })

    it('Reader readers value from storage', () => {
        storageEmulator.clear();
        expect(internalStore.keyname).not.toEqual('ReadResult');
        expect(link.reader()).not.toEqual('ReadResult');

        expect(link.writer('ReadResult')).toEqual('ReadResult');
        expect(internalStore.keyname).toEqual('ReadResult');
        expect(link.reader()).toEqual('ReadResult');
    })

    it('Writer does not allow non-string values', () => {
        expect(() => link.writer(false)).toThrow();
        expect(() => link.writer(true)).toThrow();
        expect(() => link.writer(0)).toThrow();
        expect(() => link.writer(1)).toThrow();
        expect(() => link.writer({ a: 123 })).toThrow();
    })

})

describe('whitelistChainLink', () => {
    const link = whitelistChainLink(['name', 'age', 'items', 'doesnotexist']);
    const userOriginal = { address: 'street123', name: 'John', age: 18, items: [1, 2, 3], password: 'supersecret' }

    function checkUser(operation: CallableFunction) {
        expect(userOriginal).toHaveProperty('address');
        expect(userOriginal).toHaveProperty('name');
        expect(userOriginal).toHaveProperty('age');
        expect(userOriginal).toHaveProperty('items');
        expect(userOriginal).toHaveProperty('password');

        const userOriginalJson = JSON.stringify(userOriginal);
        const userWhitelisted = operation(userOriginal);

        //Original should be immutable
        expect(JSON.stringify(userOriginal)).toEqual(userOriginalJson);

        //Only whitelisted fields should exist
        expect(userWhitelisted).toHaveProperty('name');
        expect(userWhitelisted).toHaveProperty('age');
        expect(userWhitelisted).toHaveProperty('items');
        expect(userWhitelisted).not.toHaveProperty('address');
        expect(userWhitelisted).not.toHaveProperty('password');
    }

    it('Writer removes any fields outside of whitelist', () => {
        checkUser(link.writer)
    })

    it('Reader removes any fields outside of whitelist', () => {
        checkUser(link.reader)
    })

})


describe('blacklistChainLink', () => {
    const link = blacklistChainLink(['address', 'password', 'doesnotexist']);
    const userOriginal = { address: 'street123', name: 'John', age: 18, items: [1, 2, 3], password: 'supersecret' }

    function checkUser(operation: CallableFunction) {
        expect(userOriginal).toHaveProperty('address');
        expect(userOriginal).toHaveProperty('name');
        expect(userOriginal).toHaveProperty('age');
        expect(userOriginal).toHaveProperty('items');
        expect(userOriginal).toHaveProperty('password');

        const userOriginalJson = JSON.stringify(userOriginal);
        const userBlacklisted = operation(userOriginal);

        //Original should be immutable
        expect(JSON.stringify(userOriginal)).toEqual(userOriginalJson);

        //All blacklisted fields should be removed
        expect(userBlacklisted).toHaveProperty('name');
        expect(userBlacklisted).toHaveProperty('age');
        expect(userBlacklisted).toHaveProperty('items');
        expect(userBlacklisted).not.toHaveProperty('address');
        expect(userBlacklisted).not.toHaveProperty('password');
    }

    it('Writer removes any blacklisted properties', () => {
        checkUser(link.writer)
    })

    it('Reader removes any blacklisted properties', () => {
        checkUser(link.reader)
    })

})


describe('defaultsChainLink', () => {
    const link = defaultsChainLink({ name: 'John', age: 18, password: 'blank' });
    const userOriginal = { address: 'street123', name: 'John', age: 18, items: [1, 2, 3], password: 'supersecret' }

    it('Writer removes any properties that matches default values', () => {
        const userWithoutDefaults = link.writer(userOriginal);

        expect(userWithoutDefaults).not.toHaveProperty('name');
        expect(userWithoutDefaults).not.toHaveProperty('age');

        expect(userWithoutDefaults).toHaveProperty('address');
        expect(userWithoutDefaults).toHaveProperty('items');
        expect(userWithoutDefaults).toHaveProperty('password');
        expect(userWithoutDefaults.address).toEqual('street123');
        expect(userWithoutDefaults.items).toEqual([1, 2, 3]);
        expect(userWithoutDefaults.password).toEqual('supersecret');
    })

    it('Reader replaces any missing properties with default values', () => {
        const userWithDefaults = link.reader({ address: 'street123', password: 'supersecret' });

        expect(userWithDefaults).not.toHaveProperty('items');
        expect(userWithDefaults).toHaveProperty('address');
        expect(userWithDefaults).toHaveProperty('password');
        expect(userWithDefaults).toHaveProperty('name');
        expect(userWithDefaults).toHaveProperty('age');

        expect(userWithDefaults.address).toEqual('street123');
        expect(userWithDefaults.password).toEqual('supersecret');
        expect(userWithDefaults.name).toEqual('John');
        expect(userWithDefaults.age).toEqual(18);
    })

    it('Writer must return undefined for null undefined', () => {
        expect(link.writer(undefined)).toEqual(undefined);
    })

    it('Writer must return null for null value', () => {
        expect(link.writer(null)).toEqual(null);
    })

    it('Reader must return undefined for null undefined', () => {
        expect(link.reader(undefined)).toEqual(undefined);
    })

    it('Reader must return null for null value', () => {
        expect(link.reader(null)).toEqual(null);
    })

    it('Reader must throw error for non object values', () => {
        expect(() => link.reader(false)).toThrow();
        expect(() => link.reader(true)).toThrow();
        expect(() => link.reader(0)).toThrow();
        expect(() => link.reader(1)).toThrow();
        expect(() => link.reader('ABC')).toThrow();
    })

    it('Writer must throw error for non object values', () => {
        expect(() => link.reader(false)).toThrow();
        expect(() => link.reader(true)).toThrow();
        expect(() => link.reader(0)).toThrow();
        expect(() => link.reader(1)).toThrow();
        expect(() => link.reader('ABC')).toThrow();
    })
})