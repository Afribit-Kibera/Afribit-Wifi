# Mesh: one short customer internet pass

**Operator confirmation:** retrying the consumed pass refuses access. The exact
browser message was not supplied; a separate fresh public-request result is not
inferred from that reply. The original user/counters remain intact. Router-local
absolute expiry is now prepared and fixture-tested in a separate profile;
[current native access work](mesh-native-automatic-access.md).

**Latest result, 5 October at 18:54 EAT:** the operator reports successful sign-in
and public internet access. A subsequent router inspection records cumulative
uptime **00:05:00**, matching the five-minute limit, with **1,027,046 bytes in and
16,936,662 bytes out**. The native session, dynamic authorization-list entry and
dynamic queue are absent; the phone remains an unauthorized HotSpot host and
there are zero bypass bindings. The allowance was not reset. This verifies
traffic and router-local cleanup after the allowance was consumed. An active
2M/2M queue was not captured during use, so actual throughput is not claimed.

**Phone confirmation:** the same consumed pass refuses another login. Keep its
user/counters as evidence. A separate fresh public HTTPS denial report is still
unrecorded. Automatic receipt-to-access activation, second unpaid-client
comparison and absolute wall-clock expiry remain separate gates. Evidence is
ignored `artifacts/mesh-lab/private/native-pass-activation-expiry.json`.

## Provisioning checkpoint (before sign-in)

**5 October paid commissioning checkpoint:** the previously approved KES 10
purchase settles as 85 sats through Engine and is independently verified in the
receiving Blink wallet. The operator reports **10.30.0.197** (superseding an earlier
10.30.0.19 reply). Primary's live DHCP/HotSpot host agrees on the same MAC. A fresh
nonsensitive export and AES-encrypted backup are downloaded before creating one
MAC/server-bound `mesh-e92ab0c0` user under the installed five-minute profile, with
**limit-uptime=5m**. Creation is guarded against existing trial users; no counters
or allowances are reset. Generated login credentials are only in ignored
`artifacts/mesh-lab/private/mesh-five-minute-pass.txt`.

The operator subsequently opened **http://10.30.0.1/commissioning/login** in Safari
and reported successful access. See the latest result above for the consumed
allowance and remaining phone checks. This is operator-bound lab provisioning
linked to the real receipt, not automatic public cloud checkout or a production
gateway-agent grant. [Settlement proof](mesh-engine-bitcoin-settlement.md).

Initial preparation, 5 October 2026: the five-minute profile, scoped forwarding rules and operator login were **installed on Primary** with zero trial users, active sessions and authorization-list members. The later provisioning and live results above supersede that initial state. This is not a production voucher redemption.

## Prepared files and verification

- [Primary setup](../../mikrotik/kibera-mesh-lab-01-native-pass.rsc) checks identity/serial, the installed customer HotSpot and existing deny anchors. It creates a five-minute, 2 Mbps up/down native profile and three scoped rules. It creates no user and leaves the authorization list empty.
- [Primary rollback](../../mikrotik/kibera-mesh-lab-01-remove-native-pass.rsc) closes the three rules first, then removes only users/sessions of the trial profile and that profile. It preserves the captive, private denies, IPv6 denial, protected LANs and OSPF/WAN configuration.
- [Operator login](../../mikrotik/hotspot-mesh/commissioning/login.html) is a separate RouterOS language/page variant. It collects the lab credentials and submits the native CHAP response. It is not linked from the customer welcome and does not enable cloud checkout.
- [Protocol verifier](../../scripts/mesh/verify-native-pass.mjs) uses the target router's original `hotspot/md5.js`, downloaded into ignored `artifacts/mesh-lab/native-pass-preparation/`. It independently compares the browser response with Node's MD5 over the exact CHAP byte sequence, including high bytes/quotes/backslashes. It checks that plaintext is absent from the POST and that missing challenge/hash code or JavaScript disables sign-in.

Both uploaded RSC files pass `/import ... verbose=yes dry-run` on Primary RouterOS 7.20.8. The setup then executes successfully and its profile/rule order is inspected. Its first runtime guard stopped before policy changes because this build's `find where disabled=no` filter did not match the existing enabled rule. The corrected guard reads the rule's boolean flag explicitly and retains the private-denial requirement. Protocol fixture checks pass with zero page errors. The operator login and copied router MD5 asset are uploaded, downloaded and byte/SHA-256 matched. The normal hero remains live and `billingReady` remains false.

A fresh encrypted binary backup and private export precede policy installation: ignored `artifacts/mesh-lab/native-pass-before/km-before-native-pass-20261005100454/`. Installation evidence is `artifacts/mesh-lab/native-pass-installed/verification.json`. Both wired/radio OSPF peers remain Full. No current Mesh HotSpot host/DHCP lease is available to bind a trial user; the next action is to reconnect the phone, with cellular off, and report its IPv4 address.

## Bounded operator sequence

1. **Completed:** while unpaid, the operator reports Mesh welcome for the requested **http://10.20.0.1/** check. This checks web management only, not every management port or client isolation. Do not repeat this probe unless a policy change or failure justifies it.
2. **Completed:** download the fresh encrypted backup/export and apply guarded preparation through protected SSH. Outgoing authorization follows private denial and precedes the final unpaid denial; both customer hooks remain before FastTrack. The authorization list is empty. Operator login and original MD5 helper are installed and hash verified.
3. **Completed:** the phone's live host/MAC is verified and one user is provisioned with `server=KM-MESH-001`, `profile=KM-MESH-TRIAL-5M`, the observed phone MAC and **`limit-uptime=5m`**. Credentials stay in ignored private storage. Do not reset counters or renew the user to make a failed test pass.
4. The phone opens **http://10.30.0.1/commissioning/login**, enters the local test credentials and starts the pass. Inspect the native active session, the profile's dynamic address-list member and its 2M/2M queue. Confirm one public HTTPS page opens while a second unpaid phone still cannot browse; neither may reach router management. Actual throughput measurement is separate from confirming the configured queue.
5. Keep the test phone connected until its five minutes of online allowance are consumed. Confirm local automatic logout/list cleanup and a fresh public request denied after expiry. An already-rendered page or media buffer is not proof of ongoing access. Re-login must not restore a consumed allowance. The router's timer needs no cloud polling; a cloud-disconnection test is unnecessary because this trial never connects to the cloud gateway API.
6. Remove the trial with its scoped rollback. Confirm no trial users/sessions/list members remain and unpaid policy is intact. Then address the [cloud grant/agent findings](mesh-internet-commissioning-next.md) before enabling Bitcoin checkout.

Profile `session-timeout=5m` limits one login. User `limit-uptime=5m` bounds cumulative online use across reconnects; this is not an absolute five-minutes-after-purchase deadline. A paid product with `expiresAt` still needs durable local wall-clock expiration. Native profile address-list membership plus authenticated forwarding gates this trial; IP bypass bindings are not used. [MikroTik user/profile controls](https://manual.mikrotik.com/docs/authentication-authorization-accounting/hotspot-captive-portal/).

The separate login variant is necessary because RouterOS supplies CHAP challenge values only on login pages. RouterOS supports alternate page subdirectories and `target`; arbitrary static `trial.html` would not receive those challenge values. CHAP protects this existing login exchange but does not turn the HTTP page into trusted HTTPS. Retain the lab's existing `http-chap` configuration; trusted TLS and final purchase handoff are separate commissioning work. [Page variants and CHAP](https://manual.mikrotik.com/docs/authentication-authorization-accounting/hotspot-captive-portal/hotspot-customisation/).
