import type { Readable, Writable } from 'svelte/store';
import { writable } from 'svelte/store';
export interface Chain<T> {
    chain<T>(chainLink: ChainLink): Chain<T>;
    chain<T>(writer?: CallableFunction, reader?: CallableFunction): Chain<T>;
    chain(writerOrChainLink?: CallableFunction | ChainLink, reader?: CallableFunction): Chain<T>;

    sync(): Chain<T>;

    store(initialValue?: any): Writable<T>;
    store(store: Writable<T>, initialValue?: any): Writable<T>;
    store(store: Readable<T>): Readable<T>;
    store(store?: Writable<T> | Readable<T>, initialValue?: any): Writable<T>;

    read(defaultValue: any): T;
    write(value: T): any;
}

export interface ChainLink {
    reader(value?: any): any;
    writer(value: any): any;
}

export function chain<T>(chainLink: ChainLink): Chain<T>;
export function chain<T>(writer?: CallableFunction, reader?: CallableFunction): Chain<T>;
export function chain<T>(writerOrChainLink?: CallableFunction | ChainLink, reader?: CallableFunction): Chain<T> {
    let readers = [];
    const writers = [];

    let skipFirstWrite = false;
    let attachOnce = false;
    let syncEnabled = false;
    let capturedSet: (this: void, value: T) => void;

    function read(defaultValue: any): T {
        return readers.reduce((acc, fn: any) => fn(acc), defaultValue);
    }

    function write(value: T) {
        if (skipFirstWrite) { skipFirstWrite = false; return; }
        return writers.reduce((acc, fn: any) => fn(acc), value)
    }

    function isReadable(store: any): boolean {
        if (!store) return false;
        return (typeof (store) === 'object') && ('subscribe' in store);
    }

    function isWritable(store: any): boolean {
        if (!store) return false;
        return isReadable(store) && ('set' in store) && ('update' in store);
    }

    function store(storeOrInitialValue?: Writable<T> | Readable<T> | any, initialValue?: any): Writable<T> {
        if (attachOnce) throw new Error('store() can be called only once per chain');
        attachOnce = true;

        const attachStore = isReadable(storeOrInitialValue);

        initialValue = !attachStore ? storeOrInitialValue : initialValue;
        const readValue = read(initialValue);

        let store = attachStore ? storeOrInitialValue : writable(readValue);
        const isWritableStore = isWritable(store);

        //Overwrite initial value for existing writable store (if we use readers)
        if (attachStore && isWritableStore && readers.length) {
            store.set(readValue)
        }

        if (syncEnabled) {
            if (!isWritableStore) throw new Error('sync can only be used with Writable store');
            //Capture set so we can first apply write chain
            capturedSet = store.set;
            store.set = (value: T) => write(value);
        } else {
            skipFirstWrite = true;
            store.subscribe((value: T) => write(value));
            //TODO: Is it bad that there is no unsubscribe?
        }

        return store;
    }

    function sync() {
        if (syncEnabled) throw new Error('sync can be called only once per chain');
        if (attachOnce) throw new Error('sync() must be called before store()');
        syncEnabled = true;
        return linkReaderWriter(syncWriter);
    }

    function syncWriter(value: T): T {
        capturedSet(value);
        return value;
    }

    function link(writerOrChainLink?: CallableFunction | ChainLink, reader?: CallableFunction): Chain<T> {
        if (writerOrChainLink && ('writer' in writerOrChainLink)) {
            if (reader) throw new Error('Reader expected to be undefined when chainLink used');
            return linkChain(writerOrChainLink);
        }
        return linkReaderWriter(writerOrChainLink as CallableFunction, reader);
    }

    function linkChain(chainLink: ChainLink): Chain<T> {
        return linkReaderWriter(chainLink?.writer, chainLink?.reader);
    }

    function linkReaderWriter(writer?: CallableFunction, reader?: CallableFunction): Chain<T> {
        if (writer) writers.push(writer);

        if (reader) {
            //Store readers in reverse order
            readers = [reader, ...readers];
        }

        return {
            chain: link,

            sync,
            store,

            read,
            write
        }
    }

    return link(writerOrChainLink, reader)
}