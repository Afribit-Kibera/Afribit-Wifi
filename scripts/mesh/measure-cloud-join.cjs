// Operator diagnostic: reads actual guest observations; no payment or grant.
/* eslint-disable @typescript-eslint/no-require-imports -- Run on the VM against its CommonJS daemon bundle. */
const fs = require('node:fs');
const { performance } = require('node:perf_hooks');
const { readDaemonConfig, createPinnedRouter, MeshCloudClient } = require('/opt/mesh/current/gateway-agent/mesh-daemon.js');
const env = {};
for (const line of fs.readFileSync('/etc/mesh/agent.env', 'utf8').split('\n')) {
  if (line.includes('=')) { const i=line.indexOf('='); env[line.slice(0,i)]=JSON.parse(line.slice(i+1)); }
}
const config = readDaemonConfig(env);
const router = createPinnedRouter(config), cloud = new MeshCloudClient(config);
(async () => {
  const results = [];
  for (let n=0;n<3;n++) {
    let t=performance.now();
    try {
      const host=await router.observe('10.30.0.194');
      results.push({phase:'pinnedRouterObservation',ms:Math.round(performance.now()-t),confirmed:true});
      // One legitimate short-lived join context, kept private; no payment.
      if(n===0) {
        t=performance.now(); await cloud.createContext(host);
        results.push({phase:'cloudContextCreation',ms:Math.round(performance.now()-t)});
      }
    } catch { results.push({phase:'pinnedRouterObservation',ms:Math.round(performance.now()-t),confirmed:false}); }
  }
  let t=performance.now(); const r=await fetch('https://wifi.afribit.africa/?view=internet'); await r.text();
  results.push({phase:'unattestedCatalogueHtml',ms:Math.round(performance.now()-t),status:r.status});
  router.close?.();
  console.log(JSON.stringify({results,paymentInitiated:false,accessGranted:false}));
})().catch(()=>{console.log('Join diagnostic unconfirmed; no private response printed');process.exitCode=1}).finally(()=>router.close?.());
