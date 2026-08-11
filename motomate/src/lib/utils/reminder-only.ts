export function isReminderTracker(tracker: { reminder_only?: boolean | null }): boolean {
	return tracker.reminder_only ?? false;
}
