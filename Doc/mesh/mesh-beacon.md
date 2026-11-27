# Afribit Mesh beacon (S-14)

The Afribit app shows **Verified Afribit Mesh** only when the network proves it is ours. A network name, a MAC address or a portal page can all be copied, so none of them count. What counts is a signature the app can check against a key built into it.

## What the phone checks

The app asks `https://mesh-core.afribit.africa/.well-known/afribit-mesh-beacon?nonce=<fresh>` over Wi-Fi. The answer is valid only when all of these hold:

1. The **node certificate** is signed by the Afribit mesh **root key**, whose public key is pinned in the app, and it names this mesh and node.
2. The **beacon** is signed by the key in that certificate.
3. The beacon carries the phone's **fresh nonce**, so it can't be replayed, and a validity window of 60 seconds that matches the phone's clock.
4. The beacon's `clientIp` is the **phone's own Wi-Fi address**. A fake access point that relays a real beacon shows up as a mismatch.
5. The certificate's serial is not on the **revocation list**. The list is signed by the root, and the phone keeps the newest list it has seen.
6. The certificate is within its validity period (at most 400 days).

If the network answers but fails checks 1–5, the app warns that the network **pretends to be Afribit Mesh**. A network that doesn't answer at all is simply "not on the mesh". If the phone's clock is wrong, the app asks the user to fix the date.

The formats are in `lib/mesh-access/beacon.ts`. The app's verifier is `packages/kernel/src/mesh.ts` in the Afribit app repository. Both test the same fixed vector, `tests/fixtures/mesh-beacon-vector.json`, so the two can't drift apart.

## Keys

| Key | Where it lives | Who sees it |
|---|---|---|
| Root private key `root.key.pem` | One offline machine, plus an offline backup | Nobody else. Never on a server |
| Root public key `root.pub` | Pinned in the Afribit app release; copied to each gateway | Public |
| Node private key `node-key.pem` | The gateway only, mode 0600 | Nobody else |
| Node certificate and revocation list | The gateway; served in every beacon | Public |

## Ceremony

On the offline machine:

```bash
npm run mesh:beacon -- root-keygen --out ./mesh-root
# prints rootKeyId and rootPublicKey; send rootPublicKey to the app maintainers to pin
```

On the gateway (mesh-core):

```bash
npm run mesh:beacon -- node-keygen --out /etc/afribit/mesh-beacon
# prints nodePublicKey; carry it to the offline machine
```

Back on the offline machine:

```bash
npm run mesh:beacon -- issue --root ./mesh-root --node-pub <nodePublicKey> \
  --mesh afribit-kibera --node KM-LAB-001 --days 90 --out node-cert.json
npm run mesh:beacon -- revoke --root ./mesh-root --out revocations.json   # an empty list to start
```

Copy `node-cert.json`, `revocations.json` and `root.pub` into `/etc/afribit/mesh-beacon` on the gateway. Then set `MESH_BEACON_DIR=/etc/afribit/mesh-beacon` for the controller and restart it.

The controller checks the four files against each other when it starts. A mismatch is logged as `mesh-beacon`, and the beacon stays off while paid access keeps working. Caddy forwards `/.well-known/afribit-mesh-beacon` from guests (10.30.0.0/24) only, as it does for `/start`.

## Routine work

- **Renew** each node certificate before it ends. Issue a new one from the same node key every 90 days.
- **Revoke** a lost or retired gateway: run `revoke --base revocations.json --serial <serial> --out revocations.json` on the offline machine, then copy the new list to every gateway. Phones learn it from any gateway they visit and keep it.
- **A new gateway** needs only its own node key and certificate. The app needs no update.
- **Losing the root key** means a new root pinned in a new app release. Keep the offline backup.

## Checks

```bash
npx tsx --test tests/mesh-beacon.test.ts
```

On a guest phone, the endpoint answers JSON with `"v": 2`. From outside 10.30.0.0/24, it answers 403.
