import assert from "node:assert/strict";
import test from "node:test";
import { customerPaymentMethods } from "../lib/payments/customer-methods";

test("one M-Pesa option prefers Bitika even when the backup arrives first", () => {
  assert.deepEqual(customerPaymentMethods([
    { id: "paystack", label: "M-Pesa · backup", currency: "KES" },
    { id: "btcpay", label: "Lightning", currency: "BTC" },
    { id: "bitika", label: "Bitika", currency: "KES" },
  ]), [
    { id: "bitika", label: "M-Pesa", currency: "KES" },
    { id: "btcpay", label: "Bitcoin · Lightning", currency: "BTC" },
  ]);
});

test("backup is simply M-Pesa when primary is unavailable", () => {
  assert.deepEqual(customerPaymentMethods([{ id: "paystack", label: "backup", currency: "KES" }]),
    [{ id: "paystack", label: "M-Pesa", currency: "KES" }]);
});

test("unavailable methods stay unavailable and Bitcoin remains an option", () => {
  assert.deepEqual(customerPaymentMethods([]), []);
  assert.deepEqual(customerPaymentMethods([{ id: "btcpay", label: "BTC", currency: "BTC" }]),
    [{ id: "btcpay", label: "Bitcoin · Lightning", currency: "BTC" }]);
});
