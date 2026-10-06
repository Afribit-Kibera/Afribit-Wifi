// Bounded negative checks against the owned deployment. Synthetic unsigned
// requests cannot authorize payments, voucher use or router activation.
export {};
const origin = "https://wifi.afribit.africa";
const checks = [
  { path: "/api/webhooks/bitika", bytes: 65_000, expected: 413 },
  { path: "/api/webhooks/btcpay", bytes: 65_000, expected: 413 },
  { path: "/api/admin/passkeys/registration/options", bytes: 4_100, expected: 413 },
  { path: "/api/webhooks/bitika", bytes: 2, expected: 401 },
];
async function main() {
  const results = [];
  for (const check of checks) {
    const response = await fetch(origin + check.path, {
      method: "POST", body: check.bytes === 2 ? "{}" : " ".repeat(check.bytes),
      headers: { "Content-Type": "application/json", Origin: origin },
      redirect: "error", signal: AbortSignal.timeout(30_000),
    });
    await response.body?.cancel();
    results.push({ path: check.path, bytes: check.bytes, status: response.status,
      expected: check.expected, passed: response.status === check.expected });
  }
  console.log(JSON.stringify({ origin, syntheticUnsignedRequests: true,
    financialRequestMade: false, checks: results }, null, 2));
  if (results.some(result => !result.passed)) process.exitCode = 1;
}
main().catch(() => { console.error("Owned security checks unconfirmed; no authenticated request was made"); process.exitCode = 1; });
