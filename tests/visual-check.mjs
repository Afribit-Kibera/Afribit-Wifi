import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const baseUrl = process.env.TEST_BASE_URL ?? "http://localhost:3000";
const executablePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const browser = await chromium.launch({ headless: true, executablePath });
const results = [];

async function verifyViewport(name, viewport) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const errors = [];
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  page.on("pageerror", (error) => errors.push(error.message));
  const response = await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.screenshot({ path: `artifacts/portal-${name}.png`, fullPage: true });
  results.push({
    name: `portal-${name}`,
    status: response?.status(),
    heading: await page.getByRole("heading", { name: "Connect to Bitcoin Valley." }).isVisible(),
    packageCount: await page.locator(".package-option").count(),
    overflow: await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth),
    paymentActionTop: await page.getByRole("button", { name: "Pay with Lightning" }).evaluate((element) => Math.round(element.getBoundingClientRect().top)),
    errors,
  });
  await context.close();
}

await mkdir("artifacts", { recursive: true });
await verifyViewport("desktop", { width: 1440, height: 900 });
await verifyViewport("mobile", { width: 390, height: 844 });

const adminContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const adminPage = await adminContext.newPage();
const adminErrors = [];
adminPage.on("console", (message) => { if (message.type() === "error") adminErrors.push(message.text()); });
adminPage.on("pageerror", (error) => adminErrors.push(error.message));
await adminPage.goto(`${baseUrl}/admin`, { waitUntil: "networkidle" });
const redirectedToLogin = adminPage.url().includes("/admin/login");

await adminPage.screenshot({ path: "artifacts/admin-login-desktop.png", fullPage: true });
const hasPasskeyControl = await adminPage.getByRole("button", { name: /Verify this device|Approve this device/ }).isVisible();
results.push({
  name: "admin",
  redirectedToLogin,
  hasPasskeyControl,
  errors: adminErrors,
});

const healthResponse = await adminPage.request.get(`${baseUrl}/api/health`);
results.push({ name: "health", status: healthResponse.status(), body: await healthResponse.json() });

await adminContext.close();
await browser.close();

console.log(JSON.stringify(results, null, 2));
if (!hasPasskeyControl || results.some((item) => item.status && item.status >= 400) || results.some((item) => Array.isArray(item.errors) && item.errors.length > 0)) process.exit(1);
