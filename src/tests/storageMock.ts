export const storageMock = (): Storage => {
    let internalStore: any = {};

    return {
        getItem: (key: string): string | null => key in internalStore ? internalStore[key] : null,
        setItem: (key: string, value: string): void => { internalStore[key] = value },
        clear: () => { internalStore = {} },
        key: (index: number): string | null => Object.keys(internalStore)[index],
        removeItem: (key: string) => { internalStore[key] = null },
        length: Object.keys(internalStore).length
    }
}