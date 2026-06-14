import type { PageServerLoad } from './$types';
import { getVehiclesByUser, getOdometerLogs } from '$lib/db/repositories/vehicles.js';
import { getFinanceTransactionsByVehicle } from '$lib/db/repositories/finance-transactions.js';
import { getServiceLogsByVehicle } from '$lib/db/repositories/service-logs.js';

export const load: PageServerLoad = async ({ locals }) => {
	const user = locals.user!;
	const vehicles = await getVehiclesByUser(user.id);

	const [odoByVehicle, financeByVehicle, serviceByVehicle] = await Promise.all([
		Promise.all(vehicles.map((v) => getOdometerLogs(v.id, user.id))),
		Promise.all(vehicles.map((v) => getFinanceTransactionsByVehicle(v.id, user.id))),
		Promise.all(vehicles.map((v) => getServiceLogsByVehicle(v.id, user.id)))
	]);

	return {
		user,
		vehicles: vehicles.map((v) => ({
			id: v.id,
			name: v.name,
			odometer_unit: v.odometer_unit,
			meta: v.meta as { avatar_emoji?: string } | null
		})),
		odometerLogs: odoByVehicle.flat().map((l) => ({
			vehicle_id: l.vehicle_id,
			odometer: l.odometer,
			recorded_at: l.recorded_at
		})),
		financeTransactions: financeByVehicle.flat().map((t) => ({
			vehicle_id: t.vehicle_id,
			amount_cents: t.amount_cents,
			currency: t.currency,
			category: t.category,
			performed_at: t.performed_at
		})),
		serviceLogs: serviceByVehicle.flat().map((s) => ({
			vehicle_id: s.vehicle_id,
			performed_at: s.performed_at,
			notes: s.notes ?? null
		})),
		page_prefs: user.settings?.page_prefs?.insights ?? null
	};
};
