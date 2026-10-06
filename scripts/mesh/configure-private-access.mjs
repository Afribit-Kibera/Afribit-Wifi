// Run locally. No secrets are printed or passed as process arguments.
import { randomBytes } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { parseEnv } from 'node:util';
import { spawn } from 'node:child_process';
import { join } from 'node:path';
const filename = '.env.mesh-native';
let previous = {};
try { previous = parseEnv(readFileSync(filename, 'utf8')); } catch {}
const serviceKey = previous.MESH_ROUTER_SERVICE_KEY || randomBytes(48).toString('base64url');
const encryptionKey = previous.MESH_ACCESS_ENCRYPTION_KEY || randomBytes(32).toString('base64');
const mode = process.argv[2];
if (mode === 'prepare') {
  // Supply the already-authorized router secret via stdin only.
  let password = ''; for await (const part of process.stdin) password += part;
  password = password.trim();
  if (!password) throw new Error('Router password is required on stdin');
  const values = { MESH_AUTOMATIC_AGENT_ENABLED: 'true', MESH_ACCESS_ROUTER_ID: 'KM-LAB-001',
    MESH_ROUTER_SERVICE_KEY: serviceKey, MESH_ACCESS_ENCRYPTION_KEY: encryptionKey,
    MIKROTIK_USERNAME: 'admin', MIKROTIK_PASSWORD: password };
  writeFileSync(filename, Object.entries(values).map(([key,value]) => `${key}=${JSON.stringify(value)}`).join('\n')+'\n', {mode:0o600});
  mkdirSync('artifacts/mesh-lab/private/automatic-setup', {recursive:true});
  writeFileSync('artifacts/mesh-lab/private/automatic-setup/router-password.txt', password, {mode:0o600});
  console.log('Private local automatic-access configuration prepared');
} else if (mode === 'cloud' || mode === 'commission' || mode === 'enable') {
  if (!previous.MESH_ROUTER_SERVICE_KEY || !previous.MESH_ACCESS_ENCRYPTION_KEY) throw new Error('Prepare the local configuration first');
  const values = mode === 'cloud' ? { MESH_ROUTER_SERVICE_KEY: serviceKey, MESH_ACCESS_ENCRYPTION_KEY: encryptionKey,
    MESH_ACCESS_ROUTER_ID: 'KM-LAB-001', MESH_AUTOMATIC_ACCESS_ENABLED: 'true', MESH_NATIVE_ACCESS_COMMISSIONED: 'false' }
    : mode === 'commission' ? {MESH_NATIVE_ACCESS_COMMISSIONED:'true', PAYSTACK_ENABLED:'false'}
    : {MESH_NATIVE_ACCESS_COMMISSIONED:'true', PAYSTACK_ENABLED:'true'};
  for (const [key,value] of Object.entries(values)) {
    await new Promise((resolve,reject) => {
      const child=spawn(process.execPath, [join(process.env.APPDATA,'npm','node_modules','vercel','dist','vc.js'),'env','add',key,'production','--force','--yes'],
        {windowsHide:true,stdio:['pipe','pipe','pipe']});
      child.stdout.resume(); child.stderr.resume(); child.stdin.end(value);
      child.on('error',reject); child.on('close',code=>code===0?resolve():reject(new Error(`Could not configure ${key}`)));
    });
    console.log(`${key}: configured`);
  }
} else { throw new Error('Use prepare, cloud or enable'); }
