<script lang="ts">
	import { busyStore } from 'svelte-chainstore';
	import { onMount } from 'svelte';

	//TODO: Example: Wait for onMount use case
	//TODO: Example: Avoid triggering event or setting flag in "processing"
	//TODO: Unit test
	//TODO: Docs & svelte.dev snippets

	const busy = busyStore(true); //Start Busy, so we immediately display busy state

	function delay(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	async function runSingle(a: number, b: number) {
		return busy.run(async () => {
			await delay(1000);
			return a + b;
		});
	}

	function runNested() {
		return busy.run(async () => {
			//Note that busy.run() is also called inside runSingle, nesting the calls
			//Busy will only go back to false once all nested calls have completed
			const x = await runSingle(1, 2);
			const y = await runSingle(4, 5);
			return x * y;
		});
	}

	let photos: [];
	async function fetchPhotos() {
		busy.run(async () => {
			photos = null;
			await delay(1000); //Just to shlow it down a bit!
			const res = await fetch(`https://jsonplaceholder.typicode.com/photos?_limit=20`);
			photos = await res.json();
		});
	}

	let promiseForMeaning: Promise<number>;
	async function calculateMeaningOfLife(): Promise<number> {
		await delay(3000);
		return Promise.resolve(42);
	}

	const runCalculateMeaningOfLife = () => {
		promiseForMeaning = busy.run(calculateMeaningOfLife);
		return promiseForMeaning;
	};

	function oops() {
		busy.run(async () => {
			await delay(500);
			throw new Error('Oops, I did it again');
		});
	}

	const runAll = async () => {
		fetchPhotos();
		runCalculateMeaningOfLife();
		runNested();
		//Note: We do not run oops() here, better to click button to see it in action
	};

	onMount(async () => {
		await runAll();
	});
</script>

{#if $busy}
	<h1><span class="busy">⬤</span> BUSY: One or more operations are running...</h1>
{:else}
	<h1>
		<span class="done">⬤</span> DONE: We are doing nothing.
		<button on:click={runAll}>Do Everything</button>
		<!-- Can only click this button if NO work happening -->
	</h1>
{/if}

<ul>
	<li>
		<span class:busy={$busy} class:done={!$busy}>⬤</span> Single vs. Nested
		{#if !$busy}
			<button on:click={() => runSingle(4, 5)}>Single</button>
			<button on:click={runNested}>Nested</button>
		{/if}
	</li>

	<li>
		{#if photos}
			<span class="done">⬤</span> {photos.length} photos fetched.
		{:else}
			<span class="busy">⬤</span> No photos
		{/if}
		<button on:click={fetchPhotos}>Fetch photos</button>
	</li>

	<li>
		<!-- Shows how to use await to monitor progress of individual work -->
		{#await promiseForMeaning}
			<span class="busy">⬤</span> Calculating the meaning of life. Please be patient...
		{:then meaningOfLifeAnswer}
			<span class="done">⬤</span> The meaning of life is <b>{meaningOfLifeAnswer}</b>
			<button on:click={runCalculateMeaningOfLife}>Recalculate Meaning</button>
		{/await}
	</li>
	<li>
		<span class:busy={$busy} class:done={!$busy}>⬤</span>
		Busy still false even after error (Click button, then see console log)
		{#if !$busy}
			<button on:click={oops}>Oops</button>
		{/if}
	</li>
</ul>

<style>
	.done {
		color: green;
	}

	.busy {
		color: maroon;
	}
</style>
