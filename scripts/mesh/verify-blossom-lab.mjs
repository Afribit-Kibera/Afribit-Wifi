// Existing Blossom servers; nostr-tools signs protocol auth. No private key persists.
import { generateSecretKey, finalizeEvent, verifyEvent } from 'nostr-tools';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const servers=['http://10.20.0.10:8030','http://10.21.0.198:8030'];
const sample=new URL('../../artifacts/mesh-lab/media-node1/22c999b6af2442c71a0f75d69e90c57efe52c9939919896e0b9c93a5522a6a0d.wav', import.meta.url);
// Bundled execution uses argv to locate the deliberately selected generated sample.
const bytes=await readFile(process.argv[2] || sample);
const hash=createHash('sha256').update(bytes).digest('hex');
const key=generateSecretKey();
function authorization(verb,host,expiration=Date.now()/1000+120) {
  const event=finalizeEvent({kind:24242,created_at:Math.floor(Date.now()/1000)-1,
    content:'Kibera Mesh lab: '+verb+' generated audio sample',
    tags:[['t',verb],['x',hash],['server',new URL(host).hostname],['expiration',String(Math.floor(expiration))]]},key);
  if(!verifyEvent(event)) throw Error('Auth signature invalid');
  return 'Nostr '+Buffer.from(JSON.stringify(event)).toString('base64url');
}
const result={sha256:hash,size:bytes.length,servers:[],utc:new Date().toISOString()};
for(const server of servers) {
  const unauth=await fetch(server+'/upload',{method:'PUT',headers:{'Content-Type':'audio/wav','X-SHA-256':hash},body:bytes});
  if(unauth.status!==401) throw Error('Anonymous upload unexpectedly returned '+unauth.status);
  const expired=await fetch(server+'/upload',{method:'PUT',headers:{Authorization:authorization('upload',server,Date.now()/1000-30),'Content-Type':'audio/wav','X-SHA-256':hash},body:bytes});
  if(expired.status!==401) throw Error('Expired token unexpectedly returned '+expired.status);
  // Copy from the first verified server for the second upload, not from a second local file.
  let copy=bytes;
  if(result.servers.length) {
    copy=Buffer.from(await (await fetch(result.servers[0].url)).arrayBuffer());
    if(createHash('sha256').update(copy).digest('hex')!==hash) throw Error('Source copy hash mismatch');
  }
  const upload=await fetch(server+'/upload',{method:'PUT',headers:{Authorization:authorization('upload',server),'Content-Type':'audio/wav','X-SHA-256':hash},body:copy});
  if(!upload.ok) throw Error(server+': '+upload.status+' '+await upload.text());
  const descriptor=await upload.json();
  if(descriptor.sha256!==hash || descriptor.size!==bytes.length) throw Error('Descriptor mismatch');
  const download=await fetch(descriptor.url);
  const received=Buffer.from(await download.arrayBuffer());
  if(!download.ok || createHash('sha256').update(received).digest('hex')!==hash) throw Error('Retrieved hash mismatch');
  const range=await fetch(descriptor.url,{headers:{Range:'bytes=0-43'}});
  if(range.status!==206 || (await range.arrayBuffer()).byteLength!==44) throw Error('Audio range read failed');
  result.servers.push({server,url:descriptor.url,uploadStatus:upload.status,anonymousStatus:unauth.status,expiredStatus:expired.status,verified:true,rangeStatus:range.status});
}
await writeFile('blossom-verification.json',JSON.stringify(result,null,2));
console.log(JSON.stringify(result,null,2));
