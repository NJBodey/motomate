<script lang="ts">
	import { enhance } from '$app/forms';
	import { sheet } from '$lib/stores/sheet.svelte.js';
	import { _, waitLocale } from '$lib/i18n';

	let {
		today,
		editData
	}: {
		today: string;
		editData?: { id: string; recorded_at: string; remark: string };
	} = $props();

	$effect(() => {
		waitLocale();
	});

	let submitting = $state(false);
</script>

<form
	method="POST"
	action={editData ? '?/editOdometerLog' : '?/logNote'}
	class="form"
	use:enhance={() => {
		submitting = true;
		return async ({ result, update }) => {
			await update();
			submitting = false;
			if (result.type === 'success') sheet.closeSheet();
		};
	}}
>
	{#if editData}
		<input type="hidden" name="id" value={editData.id} />
	{/if}

	<label class="field">
		<span class="field-label">{$_('vehicle.forms.fields.date')}</span>
		<input
			type="date"
			name="recorded_at"
			value={editData?.recorded_at ?? today}
			class="input"
			required
		/>
	</label>

	<label class="field">
		<span class="field-label">{$_('vehicle.forms.fields.notes')}</span>
		<input
			type="text"
			name="remark"
			value={editData?.remark ?? ''}
			placeholder={$_('vehicle.forms.placeholders.note')}
			maxlength="400"
			class="input"
			autofocus
		/>
	</label>

	<div class="form-actions">
		<button type="submit" class="btn-primary" disabled={submitting}>
			{submitting ? $_('common.saving') : $_('common.save')}
		</button>
		<button type="button" class="btn-ghost" onclick={() => sheet.closeSheet()}>
			{$_('common.cancel')}
		</button>
	</div>
</form>

<style>
	.form {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}

	.field-label {
		font-size: var(--text-sm);
		font-weight: 500;
		color: var(--text-muted);
	}

	.input {
		padding: 0.75rem;
		border: 1px solid var(--border);
		border-radius: 10px;
		background: var(--bg);
		color: var(--text);
		font-size: var(--text-md);
		width: 100%;
		min-height: 48px;
		box-sizing: border-box;
	}

	.input:hover {
		border-color: var(--border-strong);
	}

	.input:focus {
		outline: 2px solid var(--accent);
		outline-offset: 1px;
		border-color: var(--accent);
	}

	.form-actions {
		display: flex;
		gap: var(--space-3);
		padding-top: var(--space-2);
	}

	.form-actions > * {
		flex: 1;
	}

	.btn-primary {
		padding: 0.75rem 1.25rem;
		background: var(--accent);
		color: #fff;
		border: none;
		border-radius: 10px;
		font-size: var(--text-sm);
		font-weight: 500;
		cursor: pointer;
		min-height: 48px;
	}

	.btn-primary:hover {
		background: var(--accent-hover);
	}

	.btn-primary:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.btn-ghost {
		padding: 0.75rem 1.25rem;
		background: transparent;
		border: 1px solid var(--border);
		border-radius: 10px;
		font-size: var(--text-sm);
		font-weight: 500;
		cursor: pointer;
		color: var(--text-muted);
		min-height: 48px;
	}

	.btn-ghost:hover {
		background: var(--bg-muted);
		color: var(--text);
	}
</style>
