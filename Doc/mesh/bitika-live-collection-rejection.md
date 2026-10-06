# Bitika live collection rejection

**Recovery notice, 6 October 2026:** the operator supplied a message from
Bitika confirming a collection-provider outage from 28 September through
5 October and restored service on 6 October. Endpoints and webhook contracts
are reported unchanged; new transaction codes begin `qadi_`. The application's
strict uppercase-only reference validation was patched locally in the client,
webhook and commissioning receipt. Regression tests cover collection, lookup,
signed webhook delivery, duplicate settlement and unsafe-reference rejection.
The patch is not yet deployed to the customer website. A fresh authenticated
read-only quote succeeds; no new collection or Bitcoin delivery is claimed.
The original failed attempt below remains retained, without a fresh reference
or automatic recollection.

5 October 2026, Africa/Nairobi. This report contains no credentials or full payer number. It is available for the operator to share; the assistant has not contacted Bitika.

| Field | Observed value |
| --- | --- |
| First request time | 15:35:10 EAT / 12:35:10 UTC |
| Logical payment reference | `27de42cd-c474-4164-8551-4966c11f247f` |
| Environment | Live |
| Method and endpoint | `POST /api/v1/xwift/collect` |
| Amount | KES 10, supplied as string `"10"` |
| Phone | Normalized `254…` Kenyan number, omitted here |
| Lightning destination | `spira@blink.sv` |
| Idempotency | The same UUID, header and payload on both requests |
| HTTP response | 400 on the initial request and one exact replay |
| Response body | `{"code":400,"message":"An unexpected error occurred. Please try again."}` |
| Transaction code | Not returned |
| Phone-side result | Operator reports no M-Pesa prompt |
| Developer dashboard | Operator reports no error shown |

The full [official Bitika API reference](https://bitika.xyz/developers/docs) is checked against the actual request. The published base URL, live-key authentication, UUID idempotency header, string amount, normalized phone and Lightning destination match the contract. KES 10 is the published minimum, and partner API-key requests are exempt from OTP. The response does not identify the underlying cause; no additional required parameter is found in the reference.

Authenticated payer lookup returns HTTP 200, with no record for this attempt. Blink's HTTPS LNURL discovery resolves the receiving address; this does not prove a payout. No real provider callback or verified Bitcoin delivery is observed. The isolated commissioning tool creates no application sale, gateway job or access grant, and no router session is authorized.

Further collection requests are stopped. The original private receipt and reference remain intact. Server signing configuration is independently verified with a synthetic sandbox event (200) and a tampered-body rejection (401), without creating a sale. This is configuration evidence, not a provider-generated financial callback.

Current production release: `dpl_HTr3iE13v4UZ8PnXHAxe2DGjscJs`; general M-Pesa checkout remains disabled. [Full commissioning record](mesh-bitika-live-commissioning.md).
