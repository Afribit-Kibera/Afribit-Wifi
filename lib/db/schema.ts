import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const paymentStatusEnum = pgEnum("payment_status", [
  "new",
  "processing",
  "settled",
  "expired",
  "invalid",
  "refunded",
]);

export const accessStatusEnum = pgEnum("access_status", [
  "pending",
  "active",
  "expired",
  "revoked",
  "failed",
]);

export const routerJobStatusEnum = pgEnum("router_job_status", [
  "queued",
  "claimed",
  "completed",
  "failed",
]);

export const routerJobTypeEnum = pgEnum("router_job_type", [
  "grant_access",
  "revoke_access",
  "sync_walled_garden",
]);

export const packages = pgTable("packages", {
  id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    priceKes: integer("price_kes").notNull().default(0),
    priceSats: integer("price_sats").notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  dataLimitMb: integer("data_limit_mb"),
  speedLimitKbps: integer("speed_limit_kbps"),
  active: boolean("active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const portalSessions = pgTable(
  "portal_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    macAddress: text("mac_address").notNull(),
    ipAddress: text("ip_address"),
    routerId: text("router_id"),
    loginUrl: text("login_url"),
    originalUrl: text("original_url"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("portal_sessions_mac_idx").on(table.macAddress)],
);

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    portalSessionId: uuid("portal_session_id").references(() => portalSessions.id),
    packageId: uuid("package_id").references(() => packages.id),
    provider: text("provider").notNull().default("btcpay"),
    providerInvoiceId: text("provider_invoice_id"),
    status: paymentStatusEnum("status").notNull().default("new"),
    amountSats: integer("amount_sats").notNull(),
    checkoutUrl: text("checkout_url"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    settledAt: timestamp("settled_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("payments_provider_invoice_uidx").on(table.providerInvoiceId),
    index("payments_status_idx").on(table.status),
  ],
);

export const accessGrants = pgTable(
  "access_grants",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    portalSessionId: uuid("portal_session_id").references(() => portalSessions.id),
    paymentId: uuid("payment_id").references(() => payments.id),
    voucherId: uuid("voucher_id"),
    macAddress: text("mac_address").notNull(),
    status: accessStatusEnum("status").notNull().default("pending"),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    dataLimitMb: integer("data_limit_mb"),
    speedLimitKbps: integer("speed_limit_kbps"),
    purpose: text("purpose").notNull().default("paid"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("access_grants_mac_idx").on(table.macAddress)],
);

export const routerJobs = pgTable(
  "router_jobs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    type: routerJobTypeEnum("type").notNull(),
    status: routerJobStatusEnum("status").notNull().default("queued"),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
    attempts: integer("attempts").notNull().default(0),
    maxAttempts: integer("max_attempts").notNull().default(5),
    availableAt: timestamp("available_at", { withTimezone: true }).notNull().defaultNow(),
    claimedAt: timestamp("claimed_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    lastError: text("last_error"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("router_jobs_queue_idx").on(table.status, table.availableAt)],
);

export const voucherBatches = pgTable("voucher_batches", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  packageId: uuid("package_id").references(() => packages.id),
  quantity: integer("quantity").notNull(),
  saleAmountSats: integer("sale_amount_sats").notNull(),
  accessDurationMinutes: integer("access_duration_minutes").notNull(),
  dataLimitMb: integer("data_limit_mb"),
  speedLimitKbps: integer("speed_limit_kbps"),
  validFrom: timestamp("valid_from", { withTimezone: true }),
  validUntil: timestamp("valid_until", { withTimezone: true }),
  maxRedemptions: integer("max_redemptions").notNull().default(1),
  prefix: text("prefix").notNull().default("3W"),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const vouchers = pgTable(
  "vouchers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    batchId: uuid("batch_id").notNull().references(() => voucherBatches.id),
    codeHash: text("code_hash").notNull(),
    codeCiphertext: text("code_ciphertext").notNull(),
    codeLastFour: text("code_last_four").notNull(),
    redemptionCount: integer("redemption_count").notNull().default(0),
    disabled: boolean("disabled").notNull().default(false),
    lastRedeemedAt: timestamp("last_redeemed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("vouchers_code_hash_uidx").on(table.codeHash),
    index("vouchers_batch_idx").on(table.batchId),
  ],
);

export const whitelistedSites = pgTable(
  "whitelisted_sites",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    hostname: text("hostname").notNull(),
    includeSubdomains: boolean("include_subdomains").notNull().default(true),
    enabled: boolean("enabled").notNull().default(true),
    category: text("category").notNull().default("public-service"),
    notes: text("notes"),
    createdBy: text("created_by").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("whitelisted_sites_hostname_uidx").on(table.hostname)],
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    actor: text("actor").notNull(),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id"),
    details: jsonb("details").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("audit_logs_created_idx").on(table.createdAt)],
);

export const adminPasskeys = pgTable(
  "admin_passkeys",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    credentialId: text("credential_id").notNull(),
    slot: integer("slot").notNull(),
    publicKey: text("public_key").notNull(),
    counter: integer("counter").notNull().default(0),
    transports: jsonb("transports").$type<string[]>().notNull().default([]),
    deviceName: text("device_name").notNull(),
    deviceType: text("device_type").notNull(),
    backedUp: boolean("backed_up").notNull().default(false),
    aaguid: text("aaguid"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("admin_passkeys_credential_uidx").on(table.credentialId),
    uniqueIndex("admin_passkeys_active_slot_uidx").on(table.slot).where(sql`${table.revokedAt} is null`),
    index("admin_passkeys_active_idx").on(table.revokedAt),
  ],
);

export const adminEnrollmentCodes = pgTable(
  "admin_enrollment_codes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    codeHash: text("code_hash").notNull(),
    slot: integer("slot").notNull(),
    deviceName: text("device_name").notNull(),
    createdBy: text("created_by").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("admin_enrollment_codes_hash_uidx").on(table.codeHash), index("admin_enrollment_codes_expiry_idx").on(table.expiresAt)],
);
