<script lang="ts">
	/**
	 * Mount fixture proving the `$effect` testing pattern: mount the
	 * component in jsdom, assert setup ran, `unmount`, assert cleanup ran.
	 * Batches testing `$effect`-based utils copy this shape.
	 */
	interface FixtureProps {
		onSetup?: () => void;
		onCleanup?: () => void;
	}

	const { onSetup, onCleanup }: FixtureProps = $props();

	$effect(() => {
		onSetup?.();
		return () => {
			onCleanup?.();
		};
	});
</script>

<span>effect-fixture</span>
