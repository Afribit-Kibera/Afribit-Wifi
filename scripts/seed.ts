import { eq } from "drizzle-orm";
import { db } from "../lib/db";
import { packages, whitelistedSites } from "../lib/db/schema";

const packageSeeds = [
  { name: "Starter", description: "Light browsing and messaging.", priceKes: 10, priceSats: 98, durationMinutes: 80, sortOrder: 10 },
  { name: "Two Hours", description: "A quick work or study session.", priceKes: 15, priceSats: 147, durationMinutes: 120, sortOrder: 20 },
  { name: "Four Hours", description: "Longer browsing with room for calls.", priceKes: 20, priceSats: 196, durationMinutes: 240, sortOrder: 30 },
  { name: "Day Pass", description: "All-day access for regular phone use.", priceKes: 30, priceSats: 294, durationMinutes: 1440, sortOrder: 40 },
  { name: "Two Days", description: "Two days of steady access.", priceKes: 55, priceSats: 539, durationMinutes: 2880, sortOrder: 50 },
  { name: "Three Days", description: "A longer pass for home and work.", priceKes: 85, priceSats: 834, durationMinutes: 4320, sortOrder: 60 },
  { name: "Weekly", description: "Best value for the whole week.", priceKes: 140, priceSats: 1373, durationMinutes: 10080, sortOrder: 70 },
  { name: "Two Weeks", description: "Two-week access for regular users.", priceKes: 230, priceSats: 2256, durationMinutes: 20160, sortOrder: 80 },
  { name: "Monthly", description: "Monthly access for everyday connection.", priceKes: 450, priceSats: 4414, durationMinutes: 43200, sortOrder: 90 },
];

async function seed() {
  const seedNames = new Set(packageSeeds.map((item) => item.name));
  const existingPackages = await db.select({ id: packages.id, name: packages.name }).from(packages);
  for (const item of existingPackages) {
    if (!seedNames.has(item.name)) {
      await db.update(packages).set({ active: false, updatedAt: new Date() }).where(eq(packages.id, item.id));
    }
  }

  for (const item of packageSeeds) {
    const existing = await db.select({ id: packages.id }).from(packages).where(eq(packages.name, item.name)).limit(1);
    if (existing.length === 0) {
      await db.insert(packages).values({ ...item, speedLimitKbps: 8192 });
    } else {
      await db.update(packages).set({ ...item, speedLimitKbps: 8192, active: true, updatedAt: new Date() }).where(eq(packages.id, existing[0].id));
    }
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
