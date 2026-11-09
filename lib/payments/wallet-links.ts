// Links that open a wallet app with a Lightning invoice ready to pay.
// Blink opens its Send screen for blink://<invoice>, and only Blink claims that
// scheme. The router lets unpaid devices reach Blink's servers
// (scripts/mesh/blink_payments.py), so the customer can pay from this phone.
export function blinkPayLink(paymentRequest: string) {
  if (!/^ln(bc|tb|bcrt)[0-9a-z]+$/i.test(paymentRequest)) throw new Error("Not a Lightning invoice");
  return `blink://${paymentRequest.toLowerCase()}`;
}
