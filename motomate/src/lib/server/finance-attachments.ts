import { createDocument } from '$lib/db/repositories/documents.js';
import { getStorage } from '$lib/storage/index.js';
import { attachmentStorageKey } from '$lib/utils/storage.js';

export const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024; // 10 MB

const VALID_DOC_TYPES = ['service', 'quotation', 'papers', 'photo', 'notes', 'other'] as const;
type ValidDocType = (typeof VALID_DOC_TYPES)[number];

export function validateDocType(raw: string): ValidDocType {
	return VALID_DOC_TYPES.includes(raw as ValidDocType) ? (raw as ValidDocType) : 'other';
}

export type AttachmentResult = { ids: string[] } | { error: string; status: number };

/* Resolve the attachment list a transaction form submits: an optional uploaded file becomes a
   document, followed by the document IDs the form kept or linked. The result is the full list, so
   callers replace rather than append when editing. */
export async function collectAttachmentIds(
	formData: FormData,
	userId: string,
	vehicleId: string
): Promise<AttachmentResult> {
	const ids: string[] = [];
	const file = formData.get('attachment_file');

	if (file instanceof File && file.size > 0) {
		if (file.size > MAX_ATTACHMENT_SIZE) {
			return { error: 'Attachment too large (max 10 MB)', status: 400 };
		}
		const key = attachmentStorageKey(userId, file.name);
		const buffer = Buffer.from(await file.arrayBuffer());
		try {
			await getStorage().put(key, buffer, file.type || 'application/octet-stream');
		} catch (e) {
			console.error('Attachment upload failed:', e);
			return { error: 'Attachment upload failed', status: 500 };
		}
		const doc = await createDocument(userId, {
			vehicle_id: vehicleId,
			name: String(formData.get('attachment_name') || file.name)
				.trim()
				.slice(0, 200),
			doc_type: validateDocType(String(formData.get('attachment_type') || 'other')),
			storage_key: key,
			mime_type: file.type || 'application/octet-stream',
			size_bytes: file.size
		});
		ids.push(doc.id);
	}

	ids.push(...formData.getAll('linked_doc_id').map(String).filter(Boolean));
	return { ids };
}
