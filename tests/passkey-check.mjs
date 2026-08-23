import { createHash } from "node:crypto";
import { chromium } from "playwright";
import { neon } from "@neondatabase/serverless";

const baseUrl = process.env.TEST_BASE_URL ?? "http://localhost:3000";
const databaseUrl = process.env.DATABASE_URL;
const executablePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const deviceName = "Automated admin device 1";
const pairedDeviceName = "Automated admin device 2";
const firstCode = "BV-TEST-1111-2222-3333-4444-5555";
const secondCode = "BV-TEST-6666-7777-8888-9999-AAAA";
const createdBy = "test:passkey-check";

if (!databaseUrl) throw new Error("DATABASE_URL is required");

const sql = neon(databaseUrl);
const hash = (value) => createHash("sha256").update(value.trim().toUpperCase()).digest("hex");
await sql`delete from admin_passkeys where device_name in (${deviceName}, ${pairedDeviceName})`;
await sql`delete from admin_enrollment_codes where created_by = ${createdBy}`;
const [{ count }] = await sql`select count(*)::int as count from admin_passkeys where revoked_at is null`;
if (count > 0) {
  console.log(JSON.stringify({ skipped: true, reason: "An admin passkey is already enrolled" }));
  process.exit(0);
}

const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
await sql`insert into admin_enrollment_codes (code_hash, slot, device_name, created_by, expires_at) values (${hash(firstCode)}, 1, ${deviceName}, ${createdBy}, ${expiresAt})`;
await sql`insert into admin_enrollment_codes (code_hash, slot, device_name, created_by, expires_at) values (${hash(secondCode)}, 2, ${pairedDeviceName}, ${createdBy}, ${expiresAt})`;

async function addVirtualAuthenticator(context, page) {
  const cdp = await context.newCDPSession(page);
  await cdp.send("WebAuthn.enable");
  await cdp.send("WebAuthn.addVirtualAuthenticator", {
    options: {
      protocol: "ctap2",
      transport: "internal",
      hasResidentKey: true,
      hasUserVerification: true,
      isUserVerified: true,
      automaticPresenceSimulation: true,
    },
  });
}

const browser = await chromium.launch({ headless: true, executablePath });
const context = await browser.newContext();
const page = await context.newPage();
await addVirtualAuthenticator(context, page);

try {
  await page.goto(`${baseUrl}/admin/login`, { waitUntil: "networkidle" });
  await page.getByLabel("Pairing code").fill(firstCode);
  await page.getByRole("button", { name: "Approve this device" }).click();
  await page.waitForURL(`${baseUrl}/admin`);
  const enrollmentSucceeded = await page.getByRole("heading", { name: "Network overview" }).isVisible();

  await context.clearCookies();
  await page.goto(`${baseUrl}/admin/login`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Verify this device" }).click();
  await page.waitForURL(`${baseUrl}/admin`);
  const authenticationSucceeded = await page.getByRole("heading", { name: "Network overview" }).isVisible();

  const pairedContext = await browser.newContext();
  const pairedPage = await pairedContext.newPage();
  await addVirtualAuthenticator(pairedContext, pairedPage);
  await pairedPage.goto(`${baseUrl}/admin/enroll`, { waitUntil: "networkidle" });
  await pairedPage.getByLabel("Pairing code").fill(secondCode);
  await pairedPage.getByRole("button", { name: "Approve this device" }).click();
  await pairedPage.waitForURL(`${baseUrl}/admin`);
  const pairingSucceeded = await pairedPage.getByRole("heading", { name: "Network overview" }).isVisible();
  await pairedContext.clearCookies();
  await pairedPage.goto(`${baseUrl}/admin/login`, { waitUntil: "networkidle" });
  await pairedPage.getByRole("button", { name: "Verify this device" }).click();
  await pairedPage.waitForURL(`${baseUrl}/admin`);
  const pairedAuthenticationSucceeded = await pairedPage.getByRole("heading", { name: "Network overview" }).isVisible();
  await pairedContext.close();

  console.log(JSON.stringify({ enrollmentSucceeded, authenticationSucceeded, pairingSucceeded, pairedAuthenticationSucceeded }, null, 2));
  if (!enrollmentSucceeded || !authenticationSucceeded || !pairingSucceeded || !pairedAuthenticationSucceeded) process.exitCode = 1;
} finally {
  await browser.close();
  await sql`delete from admin_passkeys where device_name in (${deviceName}, ${pairedDeviceName})`;
  await sql`delete from admin_enrollment_codes where created_by = ${createdBy}`;
}
