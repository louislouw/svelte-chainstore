<script lang="ts">
	import type { Unsubscriber, Writable } from 'svelte/store';
	import { onDestroy, onMount } from 'svelte';
	import {
		chain,
		dirtyStore,
		noopChainLink,
		jsonChainLink,
		storageChainLink,
		defaultsChainLink,
		blacklistChainLink,
		whitelistChainLink,
		autoSave
	} from 'svelte-chainstore';

	interface User {
		name: string;
		age: number;
		cnt: number;
	}

	let user: Writable<User>;
	let dirty = dirtyStore();
	let autoUnsub: Unsubscriber;

	onMount(() => {
		user = chain<User>(noopChainLink())
			.chain(defaultsChainLink({ name: 'Louis' }))
			.chain(blacklistChainLink(['_id', '_ref']))
			.chain(whitelistChainLink(['name', 'age', 'cnt']))
			.chain((val: any) => {
				val['cnt'] = val['cnt'] ? ++val['cnt'] : 1;
				return val;
			})
			.sync()
			.chain(jsonChainLink())
			.chain(dirty.chainLink)
			.chain<User>(storageChainLink('chainstore_user', localStorage))
			.store({ name: 'John', age: 18, cnt: 0 });

		autoUnsub = autoSave<User>(
			(v: User) => {
				console.log('SAVED', v);
			},
			dirty,
			user,
			{ delay: 5000, preventClose: true }
		);

		console.log(autoUnsub);
	});

	onDestroy(() => {
		console.log('DESTROY', autoUnsub);
		if (autoUnsub) autoUnsub();
	});
</script>

dirty={$dirty}<br />

{#if user}
	cnt={$user?.cnt}<br />
	<h1>User</h1>
	<input bind:value={$user.name} />
	<input bind:value={$user.age} />
	<button on:click={() => dirty.reset()}>Reset Dirty</button>
{/if}
