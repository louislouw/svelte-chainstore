import type { Readable, Unsubscriber } from 'svelte/store';
import type { DirtyStore } from './dirtyStore';

type AutoSaveOptions = {
    delay?: number;
    preventClose?: boolean;
}

export const autoSave = <T>(saveFunc: CallableFunction, dirtyStore: DirtyStore, valueStore: Readable<T>, opts?: AutoSaveOptions): Unsubscriber => {
    let dirty = false;
    let value: any;
    let timeoutId: NodeJS.Timeout;
    let preventCloseActivated = false;

    const { delay, preventClose } = { delay: 500, preventClose: true, ...opts };

    const unsubValue = valueStore.subscribe(val => {
        value = val;
    })

    const unsubDirty = dirtyStore.subscribe(val => {
        dirty = val;
        if (dirty) startTimeout();
    })

    const checkPreventClose = (e: BeforeUnloadEvent) => {
        if (dirty) {
            e.preventDefault();
            e.returnValue = 'prevent';
        }
    }

    const registerPreventClose = () => {
        if (preventClose && !preventCloseActivated && window) {
            window.addEventListener('beforeunload', checkPreventClose);
            preventCloseActivated = true;
        }
    }

    const unregisterPreventClose = () => preventCloseActivated && window && window.removeEventListener('beforeunload', checkPreventClose);

    function startTimeout() {
        abortTimeout();
        timeoutId = setTimeout(save, delay);
    }

    function abortTimeout() {
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = null;
    }

    function save() {
        abortTimeout();
        if (!dirty) return;
        dirtyStore.reset();
        saveFunc(value);
    }

    function destroy() {
        save();
        unsubValue();
        unsubDirty();
        unregisterPreventClose();
    }

    function init() {
        registerPreventClose();
        return destroy;
    }

    return init();
}

