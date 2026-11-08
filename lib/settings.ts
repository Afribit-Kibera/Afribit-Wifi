import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "./db";
import { appSettings } from "./db/schema";

export const paymentSettingsSchema = z.object({
  bitcoinEnabled: z.boolean(),
  // Percent taken off the KES price when a customer pays with Bitcoin.
  bitcoinDiscountPercent: z.number().min(0).max(50),
});
export type PaymentSettings = z.infer<typeof paymentSettingsSchema>;
export const defaultPaymentSettings: PaymentSettings = { bitcoinEnabled: true, bitcoinDiscountPercent: 5 };

export async function readPaymentSettings(): Promise<PaymentSettings> {
  try {
    const [row] = await db.select().from(appSettings).where(eq(appSettings.key, "payments")).limit(1);
    const parsed = paymentSettingsSchema.safeParse(row?.value);
    return parsed.success ? parsed.data : defaultPaymentSettings;
  } catch {
    // Before the settings migration Bitcoin stays off rather than guessing a price.
    return { ...defaultPaymentSettings, bitcoinEnabled: false };
  }
}

export async function savePaymentSettings(settings: PaymentSettings, actor: string) {
  const value = paymentSettingsSchema.parse(settings);
  await db.insert(appSettings).values({ key: "payments", value, updatedBy: actor, updatedAt: new Date() })
    .onConflictDoUpdate({ target: appSettings.key, set: { value, updatedBy: actor, updatedAt: new Date() } });
}

export { bitcoinPriceKes } from "./payments/bitcoin-price";
