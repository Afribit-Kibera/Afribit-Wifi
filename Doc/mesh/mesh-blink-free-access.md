# Blink on unpaid Mesh

6 October 2026, Africa/Nairobi. **Core network allowance installed; physical
wallet refresh accepted by the operator.** This permits a small existing-account trial on
open `Mesh`, alongside the already accepted foreground Signal text trial.
The operator confirmed the installed, signed-in wallet refresh works on unpaid
Mesh with cellular data off. Phone model/version and wallet sends, new login,
installation and self-custodial Spark remain untested. The operator subsequently
reported that a notification arrived only after switching to a paid data
connection. Background push is a separate unresolved check; see
[mobile notification trial](mesh-mobile-push-trial.md).
No financial transaction was requested for this check.
Both services still need the internet gateway. Free access means no Mesh
internet pass is required for the allowed destinations; it does not mean an
offline Bitcoin wallet or free Lightning transactions.

## Installed scope

The official
[mobile production configuration](https://github.com/blinkbitcoin/blink-mobile/blob/e6f92cbe9810fdb5baedf3076f3e749bf25796e3/app/config/galoy-instances.ts)
names `api.blink.sv` for HTTPS GraphQL and authentication and `ws.blink.sv` for
secure WebSocket subscriptions. The
[mobile GraphQL client](https://github.com/blinkbitcoin/blink-mobile/blob/e6f92cbe9810fdb5baedf3076f3e749bf25796e3/app/graphql/client.tsx)
uses both. Blink's
[API documentation](https://dev.blink.sv/api/auth) independently confirms the
production GraphQL endpoint. This review inspected commit
`e6f92cbe9810fdb5baedf3076f3e749bf25796e3`; installed phone releases can differ.

Only these two FQDNs have been added to Primary `KM-LAB-001`:

| Destination | Transport | Initial purpose |
| --- | --- | --- |
| `api.blink.sv` | TCP 443 | Signed-in custodial balance, history, API/auth |
| `ws.blink.sv` | TCP 443 | Secure live subscriptions |

The list is `KM-MESH-BLINK-CORE`. HotSpot gardens are restricted to
`KM-MESH-001` and guest source `10.30.0.0/24`; RAW and forward exceptions use
the customer VLAN and WAN `ether1`. Return traffic must be established or
related. Unpaid general-internet denial, private-network isolation, existing
Signal rules, learning allowances, payment rules and expiry remain unchanged.
No customer IP binding bypass, UDP exception, wallet credential, financial
request or paid grant was added.

At **15:26 EAT**, pinned SSH and exact router identity/serial checks passed,
both garden entries and all three firewall exceptions were valid, and the
router resolved `api.blink.sv` to `34.70.145.127`. Paid active sessions were
zero; the existing two Signal forward filters remained present. This is
configuration evidence, not proof of a phone wallet refresh.

The destination addresses are DNS-resolved and may change. IP exceptions can
also admit unrelated TLS hostnames on the same address; they are **not strict
application or hostname isolation**. No wallet traffic is intercepted or
decrypted. IPv4 home-trial evidence does not establish field IPv6 policy.

## What remains outside this trial

Install/update Blink with normal internet first. App Store, Google Play,
installation assets and unrelated Apple/Google infrastructure are not opened
by this rule. The
[official app download links](https://github.com/blinkbitcoin/blink-mobile/blob/e6f92cbe9810fdb5baedf3076f3e749bf25796e3/app/config/appinfo.ts)
are useful for onboarding but do not imply free downloads on unpaid Mesh.

Current source requests Firebase AppCheck before GraphQL; its
[device-token code](https://github.com/blinkbitcoin/blink-mobile/blob/e6f92cbe9810fdb5baedf3076f3e749bf25796e3/app/screens/get-started-screen/use-device-token.ts)
uses Android Play Integrity or Apple App Attest/DeviceCheck. Token refresh can
therefore introduce additional dependencies even after sign-in. Registration
also has a
[GeeTest CAPTCHA flow](https://github.com/blinkbitcoin/blink-mobile/blob/e6f92cbe9810fdb5baedf3076f3e749bf25796e3/app/hooks/use-geetest-captcha.ts).
If refresh fails, diagnose that phone/version's missing endpoints before
adding exact destinations. Do not broadly allow Google, Apple or CAPTCHA CDNs
to make an initial test pass. Signing in using email may require separate mail
access; cellular SMS is separate from Wi-Fi data.

The source also includes self-custodial Spark/Breez functionality, external
Lightning-address/LNURL hosts, KYC, buy/sell, card services, block explorers,
point of sale and external help links. These have **not** been commissioned.
The two core hosts cannot justify an “all Blink features work” claim. Push
notifications and background behavior need their own acceptance test.

## Next phone check — no purchase or transfer

1. On normal internet, install/update Blink and sign in to the existing
   **custodial** account. Record Android/iOS version and Blink app version.
   Do not log out, migrate wallets or expose credentials for this trial.
2. Join open **Mesh**, turn cellular data off, and ensure no paid pass is
   active. Leave Primary ether1 connected. Dismiss the welcome screen using
   its “Use Mesh without internet” option and open the native Blink app.
3. Refresh the home balance and transaction history. Confirm that loading
   finishes and any network error disappears. A cached balance alone does
   not prove connectivity. A user-observed successful refresh plus the
   router's Blink counters/connections provides stronger evidence.
4. Send a Signal text each way with both apps foregrounded. Check that
   `https://example.com/?mesh-blink-free=1` stays blocked. The requested
   learning websites should remain reachable.
5. Stop at that result. Record each device's result separately. No payment,
   invoice generation or new account is required to test this milestone.

If a wallet only shows cached data or an error, report the exact error and
phone/app versions. Diagnose metadata-only destinations with a bounded
capture; do not collect wallet content, TLS keys, tokens, API keys or seed
phrases. Do not claim successful free Blink until this check passes.

## Inspect, commission and roll back

[Commissioning script](../../scripts/mesh/commission-blink-free-access.py)
is read-only by default. It imports the established pinned Primary SSH helper,
requires exact identity `KM-LAB-001` and serial `HH70A8H82EG`, and checks the
existing customer-policy anchors before adding anything. It rejects a
pre-existing or partial Blink trial instead of silently changing its scope.

```powershell
py scripts/mesh/commission-blink-free-access.py
# Only after scope review; already applied for this home trial:
py scripts/mesh/commission-blink-free-access.py --apply
# Scoped removal of this allowance only:
py scripts/mesh/commission-blink-free-access.py --remove
```

The pre-change export, post-change scope and commissioning JSON are ignored
private files under
`artifacts/mesh-lab/private/blink-free-access/20261006T122619Z/`.
The script removes only its exact owned comments/address-list entries on
failure or `--remove`; it never imports an export or resets the router.
Source syntax compilation and post-apply router readback passed. Full
wallet refresh was subsequently accepted by the operator. Notification delivery
and platform-specific coverage remain pending.
