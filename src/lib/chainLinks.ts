import type { ChainLink } from "./chainStore"

export const noopChainLink = (): ChainLink => {
    return {
        reader: (v) => v,
        writer: (v) => v
    }
}

export const jsonChainLink = (): ChainLink => {
    function reader(value: string) {
        if (value === undefined) return undefined;
        return JSON.parse(value);
    }

    return {
        reader,
        writer: JSON.stringify
    }
}

export const storageChainLink = (key: string, storage: Storage): ChainLink => {

    function reader(): string {
        return storage.getItem(key);
    }

    function writer(value: string): string {
        if (value == null) {
            storage.removeItem(key);
            return value;
        }

        if (typeof (value) !== 'string') throw new Error('storageChainLink expects string value')
        storage.setItem(key, value);
        return value;
    }

    return {
        reader,
        writer
    }
}

export const blacklistChainLink = (properties: string[]): ChainLink => {

    function removeProperties(value: any): any {
        const cleanedValue = { ...value };
        properties.forEach(properyName => delete cleanedValue[properyName]);
        return cleanedValue;
    }

    return {
        reader: removeProperties,
        writer: removeProperties
    }
}

export const whitelistChainLink = (properties: string[]): ChainLink => {

    function copyProperties(value: any): any {
        const cleanedValue = {};
        properties.forEach(properyName => properyName in value ? cleanedValue[properyName] = value[properyName] : null);
        return cleanedValue;
    }

    return {
        reader: copyProperties,
        writer: copyProperties
    }
}

export const defaultsChainLink = (defaultFields: any): ChainLink => {

    function reader(value: any): any {
        if (value == null) return value;
        if (typeof (value) !== 'object') throw new Error('Only object values may be used with defaultsChainLink');

        return { ...defaultFields, ...value };
    }

    function writer(value: any): any {
        if (value == null) return value;
        if (typeof (value) !== 'object') throw new Error('Only object values may be used with defaultsChainLink');

        const keys = Object.keys(defaultFields);
        const cleanedValue = { ...value };
        keys.forEach((properyName) => {
            if (properyName in value && cleanedValue[properyName] === defaultFields[properyName]) {
                delete cleanedValue[properyName];
            }
        })
        return cleanedValue;
    }

    return {
        reader,
        writer
    }
}