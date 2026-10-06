import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "playwright";

// All mutation endpoints are intercepted: this exercises the UI without issuing
// invoices, consuming vouchers, authorizing a device or changing a router.
const baseUrl = process.env.TEST_BASE_URL ?? "http://127.0.0.1:3000";
const executablePath = process.env.CHROME_PATH ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
const output = "artifacts/mesh-design";
const browser = await chromium.launch({ headless: true, executablePath });
const results = [];
const captive = { macAddress: "02:11:22:33:44:55", ipAddress: "10.20.0.199", routerId: "mesh-design-test", loginUrl: "http://10.20.0.1/login", originalUrl: "http://example.com/" };
const query = new URLSearchParams({ mac: captive.macAddress, ip: captive.ipAddress, router: captive.routerId, "link-login": captive.loginUrl, "link-orig": captive.originalUrl });

await mkdir(output, { recursive: true });

async function assertNoOverflow(page) {
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), false, "Page must fit viewport");
}

try {
  for (const [name, viewport] of [
    ["mobile-small", { width: 320, height: 740 }],
    ["mobile", { width: 390, height: 844 }],
    ["tablet", { width: 768, height: 1024 }],
    ["desktop", { width: 1440, height: 960 }],
  ]) {
    const context = await browser.newContext({ viewport, reducedMotion: "reduce" });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    // Guard against any unexpected mutation from future UI changes.
    await page.route("**/api/**", async (route) => route.request().method() === "GET" ? route.continue() : route.fulfill({ status: 503, json: { error: "Preview does not perform payments." } }));
    const response = await page.goto(`${baseUrl}/?${query}`, { waitUntil: "networkidle" });
    assert.equal(response.status(), 200);
    await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" });
    assert.equal(await page.getByRole("heading", { level: 1 }).textContent(), "Good thingsconnect.");
    assert.equal(await page.getByRole("tab").count(), 3);
    await assertNoOverflow(page);
    await page.screenshot({ path: `${output}/${name}-welcome.png`, fullPage: true });

    await page.getByRole("button", { name: "What is Mesh?" }).click();
    assert.equal(await page.getByRole("dialog").isVisible(), true);
    await page.keyboard.press("Escape");
    assert.equal(await page.getByRole("dialog").isVisible(), false);
    assert.equal(await page.getByRole("button", { name: "What is Mesh?" }).evaluate((element) => element === document.activeElement), true);

    await page.getByRole("tab").nth(0).focus();
    await page.keyboard.press("ArrowRight");
    assert.equal(await page.getByRole("tab").nth(1).getAttribute("aria-selected"), "true");
    await page.locator(".mesh-blink-card").click();
    assert.match(await page.getByRole("dialog").textContent(), /Free access is being prepared/);
    assert.equal(await page.getByRole("dialog").getByRole("link", { name: /Explore Blink/ }).getAttribute("href"), "https://www.blink.sv/");
    await assertNoOverflow(page);
    await page.screenshot({ path: `${output}/${name}-blink.png`, fullPage: true });
    await page.getByRole("button", { name: "Close", exact: true }).click();

    await page.getByRole("tab").nth(2).click();
    const featuredCount = await page.getByRole("radio").count();
    assert(featuredCount > 0, "Configured database must provide real passes for this integration check");
    assert(featuredCount <= 3);
    await page.getByRole("radio").last().check();
    assert.equal(await page.getByRole("radio").last().isChecked(), true);
    const selectedLabel = await page.getByRole("radio").last().locator("..").textContent();
    assert(selectedLabel.includes((await page.locator(".mesh-checkout-summary strong").textContent()).split(" · ")[0]));
    if (await page.getByRole("button", { name: /See all \d+ passes/ }).count()) {
      await page.getByRole("button", { name: /See all \d+ passes/ }).click();
      assert(await page.getByRole("radio").count() > featuredCount);
      await page.getByRole("button", { name: "Show fewer passes" }).click();
    }
    await assertNoOverflow(page);
    await page.screenshot({ path: `${output}/${name}-internet.png`, fullPage: true });
    await page.getByRole("button", { name: "Have a voucher?" }).click();
    await page.getByLabel("Voucher code").fill("3W-TEST-TEST-TEST");
    await assertNoOverflow(page);
    await page.screenshot({ path: `${output}/${name}-voucher.png`, fullPage: true });
    assert.deepEqual(errors, []);
    results.push({ name, status: 200, overflow: false, featuredCount, dialogs: "passed", keyboardTabs: "passed", errors });
    await context.close();
  }

  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
  const page = await context.newPage();
  let paymentPayload;
  let voucherPayload;
  await page.route("**/api/payments", async (route) => {
    paymentPayload = route.request().postDataJSON();
    await route.fulfill({ status: 503, json: { error: "Checkout is temporarily unavailable. Try again shortly." } });
  });
  await page.route("**/api/vouchers/redeem", async (route) => {
    voucherPayload = route.request().postDataJSON();
    await route.fulfill({ status: 400, json: { error: "That voucher is not valid. Check the code." } });
  });
  await page.goto(`${baseUrl}/?${query}&view=internet`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Mesh home" }).click();
  await page.getByRole("tab").nth(2).click();
  await page.getByRole("button", { name: "Pay with bitcoin", exact: true }).click();
  await page.locator(".mesh-form-error").waitFor();
  for (const [key, value] of Object.entries(captive)) assert.equal(paymentPayload[key], value, `Payment must preserve ${key}`);
  assert.equal(await page.getByRole("button", { name: "Pay with bitcoin", exact: true }).isEnabled(), true);
  await page.getByRole("button", { name: "Have a voucher?" }).click();
  await page.getByLabel("Voucher code").fill("3W-TEST-TEST-TEST");
  await page.getByRole("button", { name: "Use voucher", exact: true }).click();
  await page.getByText("That voucher is not valid. Check the code.").waitFor();
  assert.match(await page.locator(".mesh-form-error").textContent(), /not valid/);
  for (const [key, value] of Object.entries(captive)) assert.equal(voucherPayload[key], value, `Voucher must preserve ${key}`);

  await page.goto(`${baseUrl}/?${query}&view=voucher`, { waitUntil: "networkidle" });
  assert.equal(await page.getByLabel("Voucher code").isVisible(), true);
  await page.goto(`${baseUrl}/?view=internet`, { waitUntil: "networkidle" });
  assert.equal(await page.getByRole("button", { name: "Pay with bitcoin", exact: true }).isDisabled(), true);
  assert.match(await page.locator(".mesh-session-note").textContent(), /Connect to Mesh Wi-Fi/);
  await page.goto(`${baseUrl}/connected`, { waitUntil: "networkidle" });
  assert.match(await page.getByRole("heading", { level: 1 }).textContent(), /Welcome back/);
  assert.equal(await page.getByText("Your access pass is active on this device.").count(), 0);
  results.push({ name: "checkout-context", paymentContext: "preserved", voucherContext: "preserved", errorRecovery: "passed", voucherHandoff: "passed", missingDevice: "gated", unverifiedGrant: "not-active", realPaymentsCreated: 0 });
  await context.close();

  const adminContext = await browser.newContext();
  const admin = await adminContext.newPage();
  await admin.goto(`${baseUrl}/admin`, { waitUntil: "networkidle" });
  assert(admin.url().includes("/admin/login"));
  assert.equal(await admin.getByRole("button", { name: /Verify this device|Approve this device/ }).isVisible(), true);
  results.push({ name: "admin-access", protected: true });
  await adminContext.close();
  await writeFile(`${output}/verification.json`, JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));
} finally {
  await browser.close();
}
