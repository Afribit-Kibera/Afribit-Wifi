// Explicit or continuous bounded reconciliation; no signing keys or deletion.
import { SimplePool } from 'nostr-tools/pool';
import { verifyEvent } from 'nostr-tools/pure';
import { writeFileSync, renameSync, readFileSync, mkdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
const relays=['ws://10.20.0.10:7777/','ws://10.21.0.198:7777/'];
const filter={kinds:[1],'#t':['kibera-mesh-lab'],limit:100};
const watch=process.argv.includes('--watch');
const dirArg=process.argv.indexOf('--state-dir');
const stateDir=resolve(dirArg===-1 ? '.' : process.argv[dirArg+1]);
mkdirSync(stateDir,{recursive:true});
function atomicJson(name,value) {
  const target=join(stateDir,name), temporary=target+'.'+process.pid+'.tmp';
  writeFileSync(temporary,JSON.stringify(value,null,2));renameSync(temporary,target);
}
class WindowLimit extends Error {}
// Require a completed snapshot. SDK synthetic EOSE is later than our deadline.
async function snapshot(pool,url) {
  const relay=await pool.ensureRelay(url,{connectionTimeout:4000});
  return new Promise((resolveSnapshot,reject)=>{
    const events=new Map();let subscription,done=false;
    const finish=error=>{
      if(done)return;done=true;clearTimeout(deadline);subscription?.close();
      if (error) reject(error); else resolveSnapshot([...events.values()]);
    };
    const deadline=setTimeout(()=>finish(Error('Incomplete relay snapshot: '+url)),8000);
    try {
      subscription=relay.subscribe([filter],{
        eoseTimeout:30000,
        onevent:event=>{
          if(!verifyEvent(event)||event.kind!==1||!event.tags.some(t=>t[0]==='t'&&t[1]==='kibera-mesh-lab')) {
            finish(Error('Invalid lab event'));return;
          }
          events.set(event.id,event);
          if(events.size>=100)finish(new WindowLimit('100-post limit reached; full-history replication is not configured'));
        },
        oninvalidevent:()=>finish(Error('Invalid relay event signature')),
        oneose:()=>finish(),onclose:()=>finish(Error('Relay closed before completed snapshot: '+url)),
      });
    }catch(error){finish(error);}
  });
}
async function reconcile() {
  const pool=new SimplePool();
  try {
    const snapshots=await Promise.all(relays.map(url=>snapshot(pool,url)));
    const union=new Map(snapshots.flat().map(event=>[event.id,event]));
    if(union.size>=100)throw new WindowLimit('Combined lab history reaches the 100-post limit');
    const results=[];
    for(let i=0;i<relays.length;i++) {
      const present=new Set(snapshots[i].map(event=>event.id));let copied=0;
      for(const event of union.values()) {
        if(present.has(event.id))continue;
        await Promise.any(pool.publish([relays[i]],event,{maxWait:5000}));copied++;
        // Each host may copy concurrently; leave room in the relay's rate limit.
        await new Promise(resolveWait=>setTimeout(resolveWait,1000));
      }
      const after=new Map((await snapshot(pool,relays[i])).map(event=>[event.id,event]));
      for(const event of union.values()) {
        if(after.get(event.id)?.content!==event.content||after.get(event.id)?.sig!==event.sig) {
          throw Error('Original signed copy was not independently retrieved');
        }
      }
      results.push({relay:relays[i],before:snapshots[i].length,copied,verified:after.size});
    }
    return {verifiedUniquePosts:union.size,relays:results};
  }finally{pool.destroy();}
}
let state={lastSuccess:null,totalCopied:0};
try{state={...state,...JSON.parse(readFileSync(join(stateDir,'sync-state.json'),'utf8'))};}catch{}
do {
  const attempt=new Date().toISOString();
  try {
    const report=await reconcile();
    state={...state,status:'synced',lastAttempt:attempt,lastSuccess:new Date().toISOString(),error:null,
      lastRun:report,totalCopied:state.totalCopied+report.relays.reduce((n,r)=>n+r.copied,0),
      scope:'Tagged kind-1 lab posts only; fewer than 100; no media/deletions',intervalSeconds:watch?30:null};
    atomicJson('reconciliation-result.json',report);atomicJson('sync-state.json',state);
    if(!watch||report.relays.some(r=>r.copied))console.log(JSON.stringify(report));
  }catch(error){
    state={...state,status:error instanceof WindowLimit?'window-limit':'retrying',lastAttempt:attempt,error:error.message};
    atomicJson('sync-state.json',state);console.error(JSON.stringify({status:state.status,error:state.error}));
    if(!watch)process.exitCode=1;
  }
  // Sequential cycles; unchanged event IDs tolerate the other host's worker.
  if(watch)await new Promise(resolveWait=>setTimeout(resolveWait,30000));
}while(watch);
