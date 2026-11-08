// The enrolled router is pinned by address and SSH host key. These come from
// the controller's private environment so a replacement gateway can be enrolled
// without a code change. The Python helpers read and validate the same values.
const defaults = { host: "10.20.0.1", fingerprint: "SHA256:oyCgA93qwim6JGTa055M/07J5wvjACh0LMnrhY7DUxQ" };

export function readRouterIdentity(env: Record<string, string | undefined> = process.env) {
  const host = env.MESH_ROUTER_HOST ?? defaults.host;
  const fingerprint = env.MESH_ROUTER_HOST_KEY ?? defaults.fingerprint;
  const octets = host.split(".").map(Number);
  const privateHost = octets.length === 4 && octets.every(value => Number.isInteger(value) && value >= 0 && value <= 255) &&
    (octets[0] === 10 || (octets[0] === 192 && octets[1] === 168) || (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31));
  if (!privateHost || !/^SHA256:[A-Za-z0-9+/]{43}$/.test(fingerprint)) throw new Error("Mesh router identity is not configured");
  return { host, fingerprint };
}
