export function createPrefsSync<T extends object>(section: string, delay = 600) {
	let timer: ReturnType<typeof setTimeout> | undefined;
	let pending: T | null = null;

	function flush() {
		if (!pending) return;
		const body = JSON.stringify({ page_prefs: { [section]: pending } });
		pending = null;
		clearTimeout(timer);
		fetch('/api/prefs', {
			method: 'PATCH',
			keepalive: true,
			headers: { 'content-type': 'application/json' },
			body
		});
	}

	function schedule(prefs: T) {
		pending = prefs;
		clearTimeout(timer);
		timer = setTimeout(flush, delay);
	}

	return { schedule, flush };
}
