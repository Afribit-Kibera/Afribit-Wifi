import { chromium } from "playwright";
import { neon } from "@neondatabase/serverless";

const baseUrl = process.env.TEST_BASE_URL ?? "http://localhost:3000";
const enrollmentCode = process.env.ADMIN_ENROLLMENT_SECRET;
const databaseUrl = process.env.DATABASE_URL;
const executablePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const deviceName = "Automated passkey check";
const pairedDeviceName = "Automated paired device";

if (!enrollmentCode || !databaseUrl) throw new Error("ADMIN_ENROLLMENT_SECRET and DATABASE_URL are required");

const sql = neon(databaseUrl);
await sql`delete from admin_passkeys where device_name = ${deviceName}`;
await sql`delete from admin_passkeys where device_name = ${pairedDeviceName}`;
const [{ count }] = await sql`select count(*)::int as count from admin_passkeys where revoked_at is null`;
if (count > 0) {
  console.log(JSON.stringify({ skipped: true, reason: "An admin passkey is already enrolled" }));
  process.exit(0);
}

const browser = await chromium.launch({ headless: true, executablePath });
const context = await browser.newContext();
const page = await context.newPage();
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

try {
  await page.goto(`${baseUrl}/admin/login`, { waitUntil: "networkidle" });
  await page.getByLabel("Device name").fill(deviceName);
  await page.getByLabel("Enrollment code").fill(enrollmentCode);
  await page.getByRole("button", { name: "Register admin device" }).click();
  await page.waitForURL(`${baseUrl}/admin`);
  const enrollmentSucceeded = await page.getByRole("heading", { name: "Network overview" }).isVisible();

  await context.clearCookies();
  await page.goto(`${baseUrl}/admin/login`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Verify this device" }).click();
  await page.waitForURL(`${baseUrl}/admin`);
  const authenticationSucceeded = await page.getByRole("heading", { name: "Network overview" }).isVisible();

  await page.goto(`${baseUrl}/admin/security`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Generate pairing code" }).click();
  const pairingCode = await page.locator("code").textContent();
  if (!pairingCode) throw new Error("Pairing code was not generated");

  const pairedContext = await browser.newContext();
  const pairedPage = await pairedContext.newPage();
  const pairedCdp = await pairedContext.newCDPSession(pairedPage);
  await pairedCdp.send("WebAuthn.enable");
  await pairedCdp.send("WebAuthn.addVirtualAuthenticator", {
    options: {
      protocol: "ctap2",
      transport: "internal",
      hasResidentKey: true,
      hasUserVerification: true,
      isUserVerified: true,
      automaticPresenceSimulation: true,
    },
  });
  await pairedPage.goto(`${baseUrl}/admin/enroll`, { waitUntil: "networkidle" });
  await pairedPage.getByLabel("Device name").fill(pairedDeviceName);
  await pairedPage.getByLabel("Pairing code").fill(pairingCode);
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
  await sql`delete from admin_enrollment_codes where created_by = ${`passkey:${deviceName}`}`;
  await sql`delete from admin_passkeys where device_name = ${deviceName}`;
  await sql`delete from admin_passkeys where device_name = ${pairedDeviceName}`;
}
