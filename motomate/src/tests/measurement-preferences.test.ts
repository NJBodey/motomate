import { describe, expect, it } from 'vitest';
import { resolveDistanceUnitPreference } from '$lib/utils/measurement.js';

describe('resolveDistanceUnitPreference', () => {
	it('preserves a valid user distance preference', () => {
		expect(resolveDistanceUnitPreference('mi')).toBe('mi');
		expect(resolveDistanceUnitPreference('km')).toBe('km');
	});

	it('falls back to kilometres for unsupported or missing values', () => {
		expect(resolveDistanceUnitPreference('h')).toBe('km');
		expect(resolveDistanceUnitPreference(undefined)).toBe('km');
	});
});
