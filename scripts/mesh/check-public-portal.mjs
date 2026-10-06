import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "playwright";

// Production inspection only: no phone number, payment button, voucher,
// signed session, financial reference or administrative action is submitted.
const destination = "artifacts/mesh-lab/private/production-review";
await mkdir(destination, { recursive: true });
const browser = await chromium.launch({ headless: true });
const results = [];
try {
  for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 1000 }]) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", error => errors.push(error.name));
    await page.goto("https://wifi.afribit.africa/", { waitUntil: "networkidle", timeout: 30000 });
    await page.getByRole("heading", { name: "Get online." }).waitFor();
    const prices = await page.locator(".mesh-plan-price").allTextContents();
    assert.deepEqual(prices.map(price => Number(price.replace(/\D/g, ""))), [10, 15, 20, 30, 55, 85, 140, 230, 450]);
    assert.equal(await page.getByRole("button", { name: "Reconnect to Mesh to pay" }).isDisabled(), true);
    assert.equal(await page.getByRole("img", { name: "M-PESA", exact: true }).isVisible(), true);
    const horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    assert.equal(horizontalOverflow, false);
    assert.deepEqual(errors, []);
    await page.screenshot({ path: `${destination}/live-portal-${viewport.width}.png`, fullPage: true });
    results.push({ width: viewport.width, prices, unboundPaymentDisabled: true, mpesaLogoVisible: true, horizontalOverflow, pageErrors: errors });
    await context.close();
  }
  await writeFile(`${destination}/public-portal-browser-check.json`, JSON.stringify({ checkedAt: new Date().toISOString(), results }, null, 2));
  console.log(JSON.stringify({ checked: results.length, pricesMatch: true, unboundPaymentDisabled: true, horizontalOverflow: false, pageErrors: 0 }));
} finally {
  await browser.close();
}
