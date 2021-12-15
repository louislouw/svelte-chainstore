import { jsonChainLink, storageChainLink } from "./chainLinks"
import { chain } from "./chainStore"

export const persistStore = (key: string, defaultValue: any = null, storage: Storage = window.localStorage) => chain(jsonChainLink()).chain(storageChainLink(key, storage)).store(JSON.stringify(defaultValue));