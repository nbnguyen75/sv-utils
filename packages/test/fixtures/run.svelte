<script lang="ts">
	/**
	 * Generic mount harness for testing `$effect`-based utils: the `setup`
	 * callback runs inside `$effect` on mount, and its return value (a
	 * cleanup function or nothing) becomes the effect cleanup — so
	 * `unmount` exercises the util's disposal path.
	 */
	interface RunProps {
		setup: () => void | (() => void);
	}

	const { setup }: RunProps = $props();

	$effect(() => setup());
</script>
