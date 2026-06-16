import type { Component } from 'svelte';

class SheetStore {
	open = $state(false);
	formComponent = $state<Component<any> | undefined>(undefined);
	formData = $state<unknown>(undefined);
	title = $state('');
	hint = $state('');

	openSheet(component: Component<any>, title: string, data?: unknown) {
		this.formComponent = component;
		this.formData = data;
		this.title = title;
		this.hint = '';
		this.open = true;
	}

	closeSheet(callback?: () => void) {
		this.open = false;
		this.formComponent = undefined;
		this.formData = undefined;
		this.title = '';
		this.hint = '';
		callback?.();
	}
}

export const sheet = new SheetStore();
