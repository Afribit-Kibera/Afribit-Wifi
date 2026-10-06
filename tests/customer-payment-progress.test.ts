import assert from "node:assert/strict";
import { test } from "node:test";
import { customerPaymentState, hasActiveInternetAccess, internetHandoff } from "../lib/payments/customer-progress";

test("Unpaid device reservations never imply a received payment", () => {
  const reserved = { status: "processing", nativeAccess: { status: "pending" as const, expiresAt: null } };
  assert.equal(customerPaymentState(reserved), "waiting");
  assert.equal(customerPaymentState({ ...reserved, providerStatus: "ongoing" }), "approve");
  assert.equal(customerPaymentState({ ...reserved, providerStatus: "pay_offline" }), "approve");
});

test("Internet success needs an active gateway acknowledgement and a live deadline", () => {
  const now = Date.parse("2026-10-06T18:00:00Z");
  assert.equal(hasActiveInternetAccess({ status: "pending", expiresAt: "2026-10-06T19:00:00Z" }, now), false);
  assert.equal(hasActiveInternetAccess({ status: "active", expiresAt: "2026-10-06T19:00:00Z" }, now), true);
  assert.equal(hasActiveInternetAccess({ status: "active", expiresAt: "2026-10-06T18:00:00Z" }, now), false);
  assert.equal(hasActiveInternetAccess({ status: "active", expiresAt: "invalid" }, now), false);
  assert.equal(customerPaymentState({ status: "settled" }), "connecting");
  assert.equal(customerPaymentState({ status: "processing", resolutionRequired: true }), "review");
  assert.equal(customerPaymentState({ status: "settled", nativeAccess: { status: "active", expiresAt: "2020-01-01T00:00:00Z" } }), "expired");
});

test("Only identified captive windows automatically request the OS connectivity probe", () => {
  assert.deepEqual(internetHandoff("CaptiveNetworkSupport/1.0"), { url: "http://captive.apple.com/hotspot-detect.html", automatic: true });
  assert.deepEqual(internetHandoff("Android CaptivePortalLogin"), { url: "http://connectivitycheck.gstatic.com/generate_204", automatic: true });
  for (const agent of ["iPhone Mobile Safari", "Android Chrome Safari", "iPhone AppleWebKit Mobile", ""]) assert.equal(internetHandoff(agent).automatic, false);
});

test("Customer progress follows collection verification then router activation", () => {
  const reserved = { status: "processing", nativeAccess: { status: "pending" as const, expiresAt: null } };
  assert.equal(customerPaymentState({ ...reserved, providerStatus: "success" }), "confirming");
  assert.equal(customerPaymentState({ ...reserved, providerStatus: "processing" }), "approve");
  assert.equal(customerPaymentState({ ...reserved, providerStatus: "processing_payment" }), "confirming");
  assert.equal(customerPaymentState({ ...reserved, providerStatus: "success", collectionConfirmed: true }), "confirming");
  assert.equal(customerPaymentState({ ...reserved, status: "settled", collectionConfirmed: true, resolutionRequired: true }), "connecting");
  assert.equal(customerPaymentState({ ...reserved, nativeAccess: { status: "pending", expiresAt: new Date().toISOString() } }), "connecting");
  assert.equal(customerPaymentState({ ...reserved, nativeAccess: { status: "active" } }), "active");
  assert.equal(customerPaymentState({ ...reserved, nativeAccess: { status: "failed" } }), "review");
  assert.equal(customerPaymentState({ ...reserved, nativeAccess: { status: "expired" } }), "expired");
  assert.equal(customerPaymentState({ ...reserved, collectionConfirmed: true, settlementStatus: "review_required" }), "review");
  assert.equal(customerPaymentState({ ...reserved, status: "invalid" }), "failed");
});
