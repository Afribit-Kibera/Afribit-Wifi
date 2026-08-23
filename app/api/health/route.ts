import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

export async function GET() {
  try {
    await db.execute(sql`select 1`);
    return Response.json({ status: "ok", database: "connected", service: "bitcoin-valley-wifi" });
  } catch {
    return Response.json({ status: "degraded", database: "unavailable", service: "bitcoin-valley-wifi" }, { status: 503 });
  }
}

