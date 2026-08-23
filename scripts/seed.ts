import { eq } from "drizzle-orm";
import { db } from "../lib/db";
import { packages, whitelistedSites } from "../lib/db/schema";

const packageSeeds = [
  {
    name: "Quick Connect",
    description: "Messaging, email and a quick browse.",
    priceSats: 500,
    durationMinutes: 60,
    speedLimitKbps: 4096,
    sortOrder: 10,
  },
  {
    name: "Half Day",
    description: "A focused work session with room to stream.",
    priceSats: 1500,
    durationMinutes: 360,
    speedLimitKbps: 8192,
    sortOrder: 20,
  },
  {
    name: "Day Pass",
    description: "Full-day access across Bitcoin Valley WiFi.",
    priceSats: 2500,
    durationMinutes: 1440,
    speedLimitKbps: 10240,
    sortOrder: 30,
  },
];

async function seed() {
  for (const item of packageSeeds) {
    const existing = await db.select({ id: packages.id }).from(packages).where(eq(packages.name, item.name)).limit(1);
    if (existing.length === 0) await db.insert(packages).values(item);
  }

  const requiredSites = [
    { hostname: "wifi.afribit.africa", category: "portal", notes: "Captive portal" },
    { hostname: "pay.insats.org", category: "payment", notes: "BTCPay checkout" },
  ];

  for (const site of requiredSites) {
    const existing = await db.select({ id: whitelistedSites.id }).from(whitelistedSites).where(eq(whitelistedSites.hostname, site.hostname)).limit(1);
    if (existing.length === 0) {
      await db.insert(whitelistedSites).values({ ...site, createdBy: "system" });
    }
  }
}

seed()
  .then(() => {
    console.log("Seed complete");
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

