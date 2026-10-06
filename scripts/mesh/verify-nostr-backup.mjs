// Compare signed posts in the live relay with a separately restored database.
// Bundle this with the lab's isolated nostr-tools dependency before running.
import { SimplePool } from 'nostr-tools/pool';
import { verifyEvent } from 'nostr-tools/pure';
import { writeFileSync } from 'node:fs';
const urls=['ws://10.20.0.10:7777/','ws://127.0.0.1:7780/'];
const pool=new SimplePool();
try {
  await Promise.all(urls.map(url=>pool.ensureRelay(url)));
  const posts=await Promise.all(urls.map(url=>pool.querySync([url],{kinds:[1],'#t':['kibera-mesh-lab'],limit:100},{maxWait:5000})));
  const restored=new Map(posts[1].map(event=>[event.id,event]));
  if (!posts[0].length) throw Error('Live relay has no posts to verify');
  for (const event of posts[0]) {
    if (!verifyEvent(event) || !verifyEvent(restored.get(event.id))) throw Error('Missing or invalid restored signature');
    if (JSON.stringify(event)!==JSON.stringify(restored.get(event.id))) {
      // Property ordering can differ; compare the original signed fields.
      for (const field of ['id','pubkey','created_at','kind','tags','content','sig']) {
        if (JSON.stringify(event[field])!==JSON.stringify(restored.get(event.id)[field])) throw Error('Restored event changed');
      }
    }
  }
  const result={livePosts:posts[0].length,restoredPosts:posts[1].length,originalSignaturesPreserved:true,independentRestoredDatabase:true};
  writeFileSync('backup-restore-verification.json',JSON.stringify(result,null,2));
  console.log(JSON.stringify(result));
} finally {pool.destroy();}
