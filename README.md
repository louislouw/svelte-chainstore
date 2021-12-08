# svelte-chainstore

Perform a chain of operations on data represented by a svelte store as the data changes.

Optionally apply changes back to the store.

Optionally reverse the chain when data is read from a storage location.

## Bonus functionality
* autoSave
* dirtyStore
* busyStore
* chainLink implementations
## Example use cases
* Persist data to/from storage
* Compress/Decompress data
* Encrypt/Decrypt data
* Redo/Undo
* Apply defaults to missing properties
* Whitelist specific object properties
* Blacklist specific object properties
* Object version migration
* Validate data
* Data sanitation
* Detect if data changed (see dirtyStore)
* Remove properties that match defaults
* Serialize data
* [Case folding](https://stackoverflow.com/questions/48096063/cloud-firestore-case-insensitive-sorting-using-query)
* Make sure all changes are immutable (see [immer](https://immerjs.github.io/immer/))
* Delay/Debounce write


## Installation
    npm install -D svelte-chainstore

## Quick Example
    <script>
	import { chain } from 'svelte-chainstore';

	let changeCounter = 0;
	const name = chain((v) => v.toUpperCase())
		.chain((v) => {
			changeCounter++;
			return v;
		})
		.sync()
		.store('JOHN');
    </script>

    <!-- chain ensures name value is always uppercase and also counts the changes made -->
    <input bind:value={$name} />
    <br />This value changed {changeCounter} times.


## Credits
Inspired by [Dean Fogarty](https://df.id.au/)'s [Svelte Summit Fall 2021 presentation](https://www.youtube.com/watch?v=1Df-9EKvZr0&t=6186s)
