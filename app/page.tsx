import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { packages } from "@/lib/db/schema";
import { PortalExperience } from "@/components/portal-experience";

type HomeProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function Home({ searchParams }: HomeProps) {
  const query = await searchParams;
  const availablePackages = await db.select().from(packages).where(eq(packages.active, true)).orderBy(asc(packages.sortOrder));
  return (
    <PortalExperience
      packages={availablePackages}
      portalContext={{
        macAddress: first(query.mac) ?? first(query.macAddress) ?? "unknown",
        ipAddress: first(query.ip),
        routerId: first(query.router),
        loginUrl: first(query.link_login) ?? first(query["link-login"]),
        originalUrl: first(query.link_orig) ?? first(query["link-orig"]),
      }}
    />
  );
}

