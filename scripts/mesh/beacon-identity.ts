import { generateKeyPairSync, createPrivateKey } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { chatGateKeyEntry, issueCertificate, issueRevocations, publicKeyHex, rootKeyIdOf, type NodeCertificate, type RevocationList } from "../../lib/mesh-access/beacon";

/**
 * The Afribit Mesh beacon key ceremony (S-14). Run `root-keygen` once, on a machine that is
 * kept offline, and keep root.key.pem there. Only root.pub leaves it: the Afribit app pins
 * it, and every gateway gets a copy to check its own files.
 *
 *   root-keygen --out <dir>                       root.key.pem (secret) and root.pub
 *   node-keygen --out <dir>                       on the gateway: node-key.pem (secret) and node.pub
 *   issue  --root <dir> --node-pub <hex> --mesh <id> --node <id> [--days 90] --out <file>
 *   revoke --root <dir> [--base <revocations.json>] [--serial <s> ...] --out <file>
 *   gate-entry --cert <node-cert.json>            the chat gate's key entry for this gateway (public)
 *
 * No secret is ever printed. Private keys are written with mode 0600.
 */

const DAY = 24 * 60 * 60_000;
const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: {
    out: { type: "string" }, root: { type: "string" }, "node-pub": { type: "string" },
    mesh: { type: "string" }, node: { type: "string" }, days: { type: "string", default: "90" },
    base: { type: "string" }, cert: { type: "string" }, serial: { type: "string", multiple: true, default: [] },
  },
});

function need(name: keyof typeof values): string {
  const value = values[name];
  if (typeof value !== "string" || !value) throw new Error(`--${name} is required`);
  return value;
}

async function writeKeyPair(dir: string, secretName: string, publicName: string) {
  await mkdir(dir, { recursive: true });
  const { privateKey } = generateKeyPairSync("ed25519");
  await writeFile(join(dir, secretName), privateKey.export({ format: "pem", type: "pkcs8" }), { mode: 0o600, flag: "wx" });
  const pub = publicKeyHex(privateKey);
  await writeFile(join(dir, publicName), `${pub}\n`, { flag: "wx" });
  return pub;
}

const readRoot = async (dir: string) => createPrivateKey(await readFile(join(dir, "root.key.pem"), "utf8"));

async function main() {
  switch (positionals[0]) {
    case "root-keygen": {
      const pub = await writeKeyPair(need("out"), "root.key.pem", "root.pub");
      console.log(JSON.stringify({ rootKeyId: rootKeyIdOf(pub), rootPublicKey: pub }));
      return;
    }
    case "node-keygen": {
      const pub = await writeKeyPair(need("out"), "node-key.pem", "node.pub");
      console.log(JSON.stringify({ nodePublicKey: pub }));
      return;
    }
    case "issue": {
      const days = Number(values.days);
      if (!Number.isInteger(days) || days < 1 || days > 400) throw new Error("--days must be 1 to 400");
      const notBefore = Date.now() - 5 * 60_000;
      const cert = issueCertificate(await readRoot(need("root")), {
        meshId: need("mesh"), nodeId: need("node"), nodeKey: need("node-pub"), notBefore, notAfter: notBefore + days * DAY,
      });
      await writeFile(need("out"), `${JSON.stringify(cert, null, 2)}\n`);
      console.log(JSON.stringify({ serial: cert.serial, nodeId: cert.nodeId, notAfter: new Date(cert.notAfter).toISOString() }));
      return;
    }
    case "revoke": {
      const base = values.base ? (JSON.parse(await readFile(values.base, "utf8")) as RevocationList).serials : [];
      const list = issueRevocations(await readRoot(need("root")), [...base, ...(values.serial ?? [])], Date.now());
      await writeFile(need("out"), `${JSON.stringify(list, null, 2)}\n`);
      console.log(JSON.stringify({ revoked: list.serials.length, issuedAt: new Date(list.issuedAt).toISOString() }));
      return;
    }
    case "gate-entry": {
      const cert = JSON.parse(await readFile(need("cert"), "utf8")) as NodeCertificate;
      console.log(JSON.stringify(chatGateKeyEntry(cert), null, 2));
      return;
    }
    default:
      throw new Error("Use root-keygen, node-keygen, issue, revoke or gate-entry");
  }
}

main().catch(error => { console.error(error instanceof Error ? error.message : error); process.exit(1); });
