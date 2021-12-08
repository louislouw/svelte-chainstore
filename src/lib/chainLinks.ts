import type { ChainLink } from "./chainStore"

export const noopChainLink = (): ChainLink => {
    return {
        reader: (v) => v,
        writer: (v) => v
    }
}

export const jsonChainLink = (): ChainLink => {
    return {
        reader: JSON.parse,
        writer: JSON.stringify
    }
}

export const storageChainLink = (key: string, storage: Storage): ChainLink => {
    return {
        reader: () => storage.getItem(key),
        writer: (value) => storage.setItem(key, value)
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
        const keys = Object.keys(defaultFields);
        const cleanedValue = { ...value };
        keys.forEach((properyName) => {
            if (!(properyName in cleanedValue)) {
                cleanedValue[properyName] = defaultFields[properyName];
            }
        })
        return cleanedValue;
    }

    function writer(value: any): any {
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