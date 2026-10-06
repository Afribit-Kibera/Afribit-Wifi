import { sql } from "drizzle-orm";
import type { MeshAccessConfig } from "./config";
import type { MeshAgentAuthentication } from "./security";

// Shared PostgreSQL uniqueness, not an in-memory cache, makes concurrent calls
// on different Vercel workers accept one request. Retain hashes beyond the
// maximum 120-second future-timestamp acceptance period; never store raw auth.
export async function claimMeshAgentRequest(auth: MeshAgentAuthentication, config: MeshAccessConfig) {
  if (!/^[a-f0-9]{64}$/.test(auth.replayKey)) throw new Error("Invalid gateway request");
  const { db } = await import("../db");
  const result = await db.execute(sql`
    WITH expired AS (
      SELECT replay_key FROM mesh_agent_requests WHERE expires_at < now()
      ORDER BY expires_at LIMIT 500 FOR UPDATE SKIP LOCKED
    ), removed AS (
      DELETE FROM mesh_agent_requests WHERE replay_key IN (SELECT replay_key FROM expired)
      RETURNING replay_key
    )
    INSERT INTO mesh_agent_requests(replay_key, router_id, expires_at)
    VALUES (${auth.replayKey}, ${config.routerId}, now() + interval '5 minutes')
    ON CONFLICT (replay_key) DO NOTHING RETURNING replay_key
  `);
  return result.rows.length === 1 && result.rows[0].replay_key === auth.replayKey;
}
