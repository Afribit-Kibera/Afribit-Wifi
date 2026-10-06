import { compareThreeWestCatalogue, type CatalogueSnapshotPlan } from "./3west-catalogue";

type Query = (statement: string) => Promise<Record<string, unknown>[]>;
export type MeshRuntimeSnapshot = {
  schema: { heartbeatInstalled: boolean; ordersInstalled: boolean; checkoutReservationInstalled: boolean };
  gateways: { routerId: string; lastSeenAt: string; fresh: boolean }[];
  orders: { queued: number; claimed: number; failed: number; staleClaims: number };
  payments: { unresolved: number; olderThan15Minutes: number };
  catalogue: ReturnType<typeof compareThreeWestCatalogue>;
};

// Database reads only. Never return MACs, browser tickets, encrypted orders,
// payment identifiers, provider payloads or configuration secrets.
export async function inspectMeshRuntime(query: Query): Promise<MeshRuntimeSnapshot> {
  const [tables] = await query(`SELECT
    to_regclass('public.mesh_agent_heartbeat') IS NOT NULL AS heartbeat_installed,
    to_regclass('public.mesh_access_orders') IS NOT NULL AS orders_installed,
    EXISTS(SELECT 1 FROM pg_constraint WHERE conrelid=to_regclass('public.mesh_checkout_reservations')
      AND contype='p' AND pg_get_constraintdef(oid)='PRIMARY KEY (router_id, mac_address)') AS reservation_installed`);
  const schema = { heartbeatInstalled: tables.heartbeat_installed === true,
    ordersInstalled: tables.orders_installed === true, checkoutReservationInstalled: tables.reservation_installed === true };
  const [gateways, orders, payments, packages] = await Promise.all([
    schema.heartbeatInstalled ? query(`SELECT router_id,last_seen_at,
      last_seen_at > now()-interval '90 seconds' AND last_seen_at <= now()+interval '5 seconds' AS fresh
      FROM mesh_agent_heartbeat ORDER BY router_id`) : Promise.resolve([]),
    schema.ordersInstalled ? query(`SELECT
      count(*) FILTER(WHERE status='queued' AND expires_at > now())::int AS queued,
      count(*) FILTER(WHERE status='claimed' AND expires_at > now())::int AS claimed,
      count(*) FILTER(WHERE status='failed' AND expires_at > now())::int AS failed,
      count(*) FILTER(WHERE status='claimed' AND expires_at > now() AND (claimed_at IS NULL OR claimed_at < now()-interval '5 minutes'))::int AS stale_claims
      FROM mesh_access_orders`) : Promise.resolve([]),
    query(`SELECT count(*)::int AS unresolved,
      count(*) FILTER(WHERE created_at < now()-interval '15 minutes')::int AS older_than_15_minutes
      FROM payments WHERE provider='paystack' AND status IN ('new','processing')
        AND metadata ? 'paystackChargeStartedAt' AND metadata ? 'meshContextId'`),
    query("SELECT name,price_kes,active,speed_limit_kbps,data_limit_mb FROM packages WHERE active ORDER BY sort_order"),
  ]);
  const catalogue: CatalogueSnapshotPlan[] = packages.map(plan => ({ name: String(plan.name), priceKes: Number(plan.price_kes),
    active: plan.active === true, speedLimitKbps: plan.speed_limit_kbps === null ? null : Number(plan.speed_limit_kbps),
    dataLimitMb: plan.data_limit_mb === null ? null : Number(plan.data_limit_mb) }));
  return { schema, gateways: gateways.map(row => ({ routerId: String(row.router_id),
    lastSeenAt: new Date(String(row.last_seen_at)).toISOString(), fresh: row.fresh === true })),
    orders: { queued: Number(orders[0]?.queued ?? 0), claimed: Number(orders[0]?.claimed ?? 0),
      failed: Number(orders[0]?.failed ?? 0), staleClaims: Number(orders[0]?.stale_claims ?? 0) },
    payments: { unresolved: Number(payments[0]?.unresolved ?? 0), olderThan15Minutes: Number(payments[0]?.older_than_15_minutes ?? 0) },
    catalogue: compareThreeWestCatalogue(catalogue) };
}

export function evaluateMeshReadiness(snapshot: MeshRuntimeSnapshot, config: {
  automaticConfigured: boolean; checkoutConfigured: boolean;
}) {
  const automaticBlockers = [
    ...(!config.automaticConfigured ? ["automatic_access_not_configured"] : []),
    ...(!config.checkoutConfigured ? ["payment_checkout_not_configured"] : []),
    ...(!snapshot.schema.ordersInstalled || !snapshot.schema.checkoutReservationInstalled ? ["automatic_schema_missing"] : []),
    ...(!snapshot.gateways.some(gateway => gateway.routerId === "KM-LAB-001" && gateway.fresh) ? ["enrolled_gateway_stale"] : []),
    ...(snapshot.orders.failed > 0 || snapshot.orders.staleClaims > 0 ? ["access_handoff_needs_review"] : []),
    ...(snapshot.catalogue.actualProducts === 0 ? ["no_active_packages"] : []),
  ];
  // These are limitations of this release, not booleans an environment flag
  // can waive. Packet paths and operational acceptance require field evidence.
  const fieldBlockers = [...automaticBlockers,
    ...(!snapshot.catalogue.catalogueMatches ? ["3west_catalogue_not_matched"] : []),
    "serving_gateway_not_enrolled", "trusted_local_join_tls_not_commissioned",
    "field_packet_paths_not_verified", "unattended_startup_not_commissioned",
    "customer_migration_not_verified", "device_recovery_not_implemented",
    "capacity_and_restore_not_accepted", "production_secret_rotation_not_verified",
    "application_security_release_not_verified",
  ];
  return { scope: "Current lab enrollment; configuration and database checks only",
    automaticLane: { status: automaticBlockers.length ? "not_ready" : "ready_for_home_test", blockers: automaticBlockers },
    field: { status: "not_ready", blockers: fieldBlockers },
    warnings: snapshot.payments.olderThan15Minutes ? ["unresolved_payment_review_required"] : [],
    // No provider request, real collection, treasury send or router mutation is
    // part of this evaluator. A ready home lane is not a payment guarantee.
  };
}
