import assert from "node:assert/strict";
import { test } from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
import { evaluateMeshReadiness, inspectMeshRuntime } from "../lib/production/runtime-readiness";

test("Read-only Mesh preflight separates a configured home lane from field readiness and preserves unresolved collections", async () => {
  const pg = await PGlite.create();
  await pg.exec(`CREATE TABLE packages(name text,price_kes int,active boolean,speed_limit_kbps int,data_limit_mb int,sort_order int);
    INSERT INTO packages VALUES('Starter',10,true,50000,NULL,0);
    CREATE TABLE payments(id uuid PRIMARY KEY,provider text,status text,metadata jsonb,created_at timestamptz);
    INSERT INTO payments VALUES(gen_random_uuid(),'paystack','processing','{"paystackChargeStartedAt":1,"meshContextId":"private-fixture"}',now()-interval '1 day');
    CREATE TABLE mesh_agent_heartbeat(router_id text,last_seen_at timestamptz);
    INSERT INTO mesh_agent_heartbeat VALUES('KM-LAB-001',now());
    CREATE TABLE mesh_access_orders(status text,expires_at timestamptz,claimed_at timestamptz);`);
  const query = async (statement: string) => (await pg.query<Record<string, unknown>>(statement)).rows;
  try {
    const missing = await inspectMeshRuntime(query);
    assert.equal(missing.schema.checkoutReservationInstalled, false);
    assert(evaluateMeshReadiness(missing, { automaticConfigured: true, checkoutConfigured: true }).automaticLane.blockers.includes("automatic_schema_missing"));
    await pg.exec(await readFile("scripts/mesh/checkout-reservations-schema.sql", "utf8"));
    const working = await inspectMeshRuntime(query);
    assert.equal(working.schema.checkoutReservationInstalled, true);
    const ready = evaluateMeshReadiness(working, { automaticConfigured: true, checkoutConfigured: true });
    assert.equal(ready.automaticLane.status, "ready_for_home_test");
    assert.equal(ready.field.status, "not_ready");
    assert(ready.field.blockers.includes("3west_catalogue_not_matched"));
    assert(ready.field.blockers.includes("serving_gateway_not_enrolled"));
    assert.equal(working.payments.olderThan15Minutes, 1);
    assert(!JSON.stringify(working).includes("private-fixture"));
    assert.equal((await pg.query<{ status: string }>("SELECT status FROM payments")).rows[0].status, "processing", "Inspection never expires or recollects uncertain payments");
    await pg.exec("UPDATE mesh_agent_heartbeat SET last_seen_at=now()+interval '10 minutes'");
    assert(evaluateMeshReadiness(await inspectMeshRuntime(query), { automaticConfigured: true, checkoutConfigured: true }).automaticLane.blockers.includes("enrolled_gateway_stale"));
    await pg.exec("UPDATE mesh_agent_heartbeat SET last_seen_at=now()-interval '2 minutes'");
    assert(evaluateMeshReadiness(await inspectMeshRuntime(query), { automaticConfigured: true, checkoutConfigured: true }).automaticLane.blockers.includes("enrolled_gateway_stale"));
    await pg.exec("UPDATE mesh_agent_heartbeat SET last_seen_at=now(); INSERT INTO mesh_access_orders VALUES('claimed',now()+interval '1 hour',NULL)");
    assert(evaluateMeshReadiness(await inspectMeshRuntime(query), { automaticConfigured: true, checkoutConfigured: true }).automaticLane.blockers.includes("access_handoff_needs_review"));
  } finally { await pg.close(); }
});
