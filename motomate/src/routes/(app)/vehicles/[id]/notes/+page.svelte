<script lang="ts">
	import { untrack } from 'svelte';
	import { _, waitLocale } from '$lib/i18n';
	import { sheet } from '$lib/stores/sheet.svelte.js';
	import { toasts } from '$lib/stores/toasts.svelte.js';
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';
	import VehicleNoteForm from '$lib/components/vehicle/VehicleNoteForm.svelte';
	import ConfirmDialog from '$lib/components/ui/ConfirmDialog.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';

	let { data, form }: { data: PageData; form: Record<string, unknown> | null } = $props();

	$effect(() => {
		waitLocale();
	});

	$effect(() => {
		const f = form;
		untrack(() => {
			if ((f as any)?.success) {
				toasts.success($_('vehicle.notes.saved'));
			}
		});
	});

	let deletingId = $state<string | null>(null);

	function openNewNote() {
		sheet.openSheet(
			VehicleNoteForm,
			$_('vehicle.notes.new'),
			{
				vehicleId: data.vehicle.id,
				allDocs: data.docList ?? []
			},
			true
		);
	}

	function openEditNote(note: (typeof data.notes)[number]) {
		sheet.openSheet(
			VehicleNoteForm,
			$_('vehicle.notes.edit'),
			{
				vehicleId: data.vehicle.id,
				allDocs: data.docList ?? [],
				editData: {
					id: note.id,
					title: note.title,
					content: note.content,
					doc_refs: parseDocRefs(note.doc_refs)
				}
			},
			true
		);
	}

	function parseDocRefs(raw: unknown): string[] {
		if (Array.isArray(raw)) return raw as string[];
		if (typeof raw === 'string') {
			try {
				return JSON.parse(raw);
			} catch {
				return [];
			}
		}
		return [];
	}

	function noteExcerpt(content: string): string {
		const plain = content
			.replace(/#{1,6}\s/g, '')
			.replace(/\*{1,2}([^*]+)\*{1,2}/g, '$1')
			.replace(/`[^`]+`/g, '')
			.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
			.replace(/>\s/g, '')
			.trim();
		const first = plain.split('\n').find((l) => l.trim().length > 0) ?? '';
		return first.length > 120 ? first.slice(0, 120) + '…' : first;
	}

	function formatDate(iso: string): string {
		return new Date(iso).toLocaleDateString(data.user?.settings?.locale ?? 'en', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	function resolvedDocRefs(note: (typeof data.notes)[number]) {
		const refs = parseDocRefs(note.doc_refs);
		if (!refs.length) return [];
		const map = new Map((data.docList ?? []).map((d) => [d.id, d]));
		return refs.map((id) => map.get(id)).filter(Boolean) as (typeof data.docList)[number][];
	}
</script>

<svelte:head
	><title
		>{$_('vehicle.notes.pageTitle', { values: { name: data.vehicle.name } })} · {$_(
			'layout.brand'
		)}</title
	></svelte:head
>

<div class="page-header">
	<div class="page-header-text">
		<h2 class="section-title">{$_('vehicle.notes.title')}</h2>
		<p class="section-sub">{$_('vehicle.notes.subtitle')}</p>
	</div>
	<div class="page-actions">
		<button class="btn-primary" onclick={openNewNote}>
			+ {$_('vehicle.notes.new')}
		</button>
	</div>
</div>

{#if data.notes.length === 0}
	<EmptyState
		icon="📝"
		title={$_('vehicle.notes.empty.title')}
		description={$_('vehicle.notes.empty.desc')}
	/>
{:else}
	<div class="notes-list">
		{#each data.notes as note (note.id)}
			{@const docs = resolvedDocRefs(note)}
			<div class="note-card">
				<div
					class="note-body"
					role="button"
					tabindex="0"
					onclick={() => openEditNote(note)}
					onkeydown={(e) => e.key === 'Enter' && openEditNote(note)}
				>
					<div class="note-title">
						{note.title || $_('vehicle.notes.untitled')}
					</div>
					{#if noteExcerpt(note.content)}
						<div class="note-excerpt">{noteExcerpt(note.content)}</div>
					{/if}
					{#if docs.length > 0}
						<div class="note-doc-refs">
							{#each docs as doc}
								<a
									href="/api/files?key={doc.storage_key}"
									target="_blank"
									rel="noopener noreferrer"
									class="doc-chip"
									onclick={(e) => e.stopPropagation()}
								>
									<span class="doc-chip-type">{$_('documents.types.' + doc.doc_type)}</span>
									<span class="doc-chip-name">{doc.title || doc.name}</span>
								</a>
							{/each}
						</div>
					{/if}
				</div>
				<div class="note-meta">
					<span class="note-date">{formatDate(note.updated_at)}</span>
					<div class="note-actions">
						<button
							type="button"
							class="note-action-btn"
							onclick={() => openEditNote(note)}
							aria-label={$_('common.edit')}
						>
							{$_('common.edit')}
						</button>
						<button
							type="button"
							class="note-action-btn note-action-btn--danger"
							onclick={() => (deletingId = note.id)}
							aria-label={$_('common.delete')}
						>
							{$_('common.delete')}
						</button>
					</div>
				</div>
			</div>
		{/each}
	</div>
{/if}

{#if deletingId}
	<ConfirmDialog
		open={true}
		title={$_('vehicle.notes.delete.title')}
		description={$_('vehicle.notes.delete.desc')}
		confirmLabel={$_('vehicle.notes.delete.confirm')}
		cancelLabel={$_('vehicle.notes.delete.cancel')}
		danger={true}
		loading={false}
		onconfirm={() => {
			const id = deletingId!;
			deletingId = null;
			const f = document.createElement('form');
			f.method = 'POST';
			f.action = '?/delete';
			const input = document.createElement('input');
			input.type = 'hidden';
			input.name = 'id';
			input.value = id;
			f.appendChild(input);
			document.body.appendChild(f);
			f.submit();
		}}
		onclose={() => (deletingId = null)}
	/>
{/if}

<style>
	.page-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--space-4);
		flex-wrap: wrap;
		margin-bottom: var(--space-6);
	}

	.page-header-text {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.section-title {
		font-size: var(--text-lg);
		font-weight: 600;
		color: var(--text);
		margin: 0;
	}

	.section-sub {
		font-size: var(--text-sm);
		color: var(--text-muted);
		margin: 0;
	}

	.page-actions {
		flex-shrink: 0;
	}

	.btn-primary {
		padding: 0.5rem 1rem;
		background: var(--accent);
		color: #fff;
		border: none;
		border-radius: 10px;
		font-size: var(--text-sm);
		font-weight: 500;
		cursor: pointer;
	}

	.btn-primary:hover {
		background: var(--accent-hover);
	}

	.notes-list {
		display: flex;
		flex-direction: column;
	}

	.note-card {
		padding: 0.875rem 0;
		border-bottom: 1px solid var(--border);
		display: flex;
		align-items: flex-start;
		gap: var(--space-4);
	}

	.note-card:first-child {
		border-top: 1px solid var(--border);
	}

	.note-body {
		flex: 1;
		min-width: 0;
		cursor: pointer;
	}

	.note-title {
		font-size: var(--text-base);
		font-weight: 500;
		color: var(--text);
		line-height: var(--leading-snug);
	}

	.note-excerpt {
		font-size: var(--text-sm);
		color: var(--text-muted);
		margin-top: 0.25rem;
		line-height: var(--leading-snug);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.note-doc-refs {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
		margin-top: 0.5rem;
	}

	.doc-chip {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		font-size: var(--text-xs);
		border: 1px solid var(--border);
		border-radius: 5px;
		padding: 2px 6px 2px 4px;
		background: var(--bg);
		text-decoration: none;
		transition:
			border-color 0.1s,
			background 0.1s;
	}

	.doc-chip:hover {
		border-color: var(--accent);
		background: var(--accent-subtle);
	}

	.doc-chip-type {
		font-size: 10px;
		font-weight: 500;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.doc-chip:hover .doc-chip-type {
		color: var(--accent);
	}

	.doc-chip-name {
		color: var(--text-muted);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		max-width: 120px;
	}

	.doc-chip:hover .doc-chip-name {
		color: var(--accent);
	}

	.note-meta {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: var(--space-2);
		flex-shrink: 0;
	}

	.note-date {
		font-size: var(--text-xs);
		color: var(--text-subtle);
		white-space: nowrap;
		font-family: var(--font-mono);
		font-variant-numeric: tabular-nums;
	}

	.note-actions {
		display: flex;
		gap: var(--space-2);
	}

	.note-action-btn {
		font-size: var(--text-xs);
		font-weight: 500;
		color: var(--text-subtle);
		background: none;
		border: 1px solid var(--border);
		border-radius: 5px;
		padding: 0.25rem 0.5rem;
		cursor: pointer;
		transition:
			color 0.1s,
			border-color 0.1s,
			background 0.1s;
	}

	.note-action-btn:hover {
		color: var(--text);
		border-color: var(--border-strong);
		background: var(--bg-muted);
	}

	.note-action-btn--danger:hover {
		color: var(--status-overdue);
		border-color: color-mix(in srgb, var(--status-overdue) 40%, transparent);
		background: color-mix(in srgb, var(--status-overdue) 6%, transparent);
	}

	@media (max-width: 480px) {
		.note-card {
			flex-direction: column;
			gap: var(--space-2);
		}

		.note-meta {
			flex-direction: row;
			align-items: center;
			justify-content: space-between;
			width: 100%;
		}
	}
</style>
