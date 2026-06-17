<script lang="ts">
	import { _ } from '$lib/i18n';

	let {
		savedAt,
		hasUnsavedFile = false,
		onDiscard
	}: {
		savedAt: string;
		hasUnsavedFile?: boolean;
		onDiscard: () => void;
	} = $props();

	const ago = $derived.by(() => {
		const ms = Date.now() - new Date(savedAt).getTime();
		if (ms < 60_000) return $_('draft.justNow');
		if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}${$_('draft.unitMin')}`;
		if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)}${$_('draft.unitHour')}`;
		return `${Math.floor(ms / 86_400_000)}${$_('draft.unitDay')}`;
	});
</script>

<div class="draft-banner">
	<div class="draft-info">
		<span class="draft-label">{$_('draft.resuming', { values: { ago } })}</span>
		{#if hasUnsavedFile}
			<span class="draft-file-hint">{$_('draft.fileHint')}</span>
		{/if}
	</div>
	<button type="button" class="draft-discard" onclick={onDiscard}>
		{$_('draft.discard')}
	</button>
</div>

<style>
	.draft-banner {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-3);
		padding: var(--space-3) var(--space-4);
		background: color-mix(in srgb, var(--accent) 6%, var(--bg));
		border: 1px solid color-mix(in srgb, var(--accent) 20%, transparent);
		border-radius: 8px;
		font-size: var(--text-sm);
	}

	.draft-info {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}

	.draft-label {
		color: var(--text-muted);
		font-weight: 500;
	}

	.draft-file-hint {
		font-size: var(--text-xs);
		color: var(--status-due);
	}

	.draft-discard {
		background: none;
		border: 1px solid color-mix(in srgb, var(--accent) 30%, transparent);
		border-radius: 6px;
		color: var(--accent);
		font-size: var(--text-xs);
		font-weight: 500;
		cursor: pointer;
		padding: 0.25rem 0.625rem;
		white-space: nowrap;
		flex-shrink: 0;
		transition:
			background 0.1s,
			border-color 0.1s;
	}

	.draft-discard:hover {
		background: color-mix(in srgb, var(--accent) 10%, transparent);
		border-color: var(--accent);
	}
</style>
