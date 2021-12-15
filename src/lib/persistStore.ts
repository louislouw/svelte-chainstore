import { jsonChainLink, readDefaultChainLink, storageChainLink } from "./chainLinks"
import { chain } from "./chainStore"

export const persistStore = (key: string, initialValue: any = null, storage: Storage = window.localStorage) => chain(readDefaultChainLink(initialValue)).chain(jsonChainLink()).chain(storageChainLink(key, storage)).store();