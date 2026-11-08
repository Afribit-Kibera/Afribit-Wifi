import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { test } from "node:test";
import { createLiveObserver } from "../gateway-agent/mesh-observer";

// A real child process exercises framing, request identity and transport
// failure/restart; it does not make router requests or issue access.
const fixture = `
const readline=require('node:readline');let ready=false,count=0;
readline.createInterface({input:process.stdin}).on('line',line=>{
 const value=JSON.parse(line);
 if(!ready){ready=true;console.log(JSON.stringify({ready:true}));return;}
 if(value.ipAddress==='10.30.0.198'){process.exit(1);return;}
 count++;
 console.log(JSON.stringify({id:value.id,host:{ipAddress:value.ipAddress,server:'KM-MESH-001',macAddress:'02:11:22:33:44:'+String(count).padStart(2,'0')}}));
});`;

test("Observer reuses transport but reads a fresh host every time and rejects management peers", async () => {
  let workers=0;
  const observer=createLiveObserver({python:"unused",routerUsername:"fixture",routerPassword:"secret-not-logged"},()=>{
    workers++;return spawn(process.execPath,["-e",fixture],{stdio:["pipe","pipe","pipe"]});
  });
  try {
    observer.warm();
    const first=await observer.observe("10.30.0.194"), second=await observer.observe("10.30.0.194");
    assert.equal(workers,1);
    assert.notEqual(first.macAddress,second.macAddress,"Never cache the host binding across requests");
    await assert.rejects(observer.observe("10.20.0.10"));
    assert.equal(workers,1);
    await assert.rejects(observer.observe("10.30.0.198"),/unavailable/);
    const recovered=await observer.observe("10.30.0.194");
    assert.equal(workers,2);
    assert.equal(recovered.ipAddress,"10.30.0.194");
  } finally {observer.close();}
});

test("A warmed observer reconnects in the background after the transport drops", async () => {
  let workers=0;
  const observer=createLiveObserver({python:"unused",routerUsername:"fixture",routerPassword:"fixture"},()=>{
    workers++;return spawn(process.execPath,["-e",fixture],{stdio:["pipe","pipe","pipe"]});
  },{rewarmMs:50});
  try {
    observer.warm();
    await observer.observe("10.30.0.194");
    await assert.rejects(observer.observe("10.30.0.198"),/unavailable/); // worker exits, like a dropped SSH session
    const deadline=Date.now()+3_000;
    while (workers<2 && Date.now()<deadline) await new Promise(r=>setTimeout(r,20));
    assert.equal(workers,2,"The transport is re-opened before the next customer arrives");
    const started=Date.now(), host=await observer.observe("10.30.0.194");
    assert.equal(host.ipAddress,"10.30.0.194");
    assert.equal(workers,2);
    assert.ok(Date.now()-started<1_000);
  } finally {observer.close();}
});

test("Observer refuses a valid-looking response that belongs to another socket peer", async () => {
  const observer=createLiveObserver({python:"unused",routerUsername:"fixture",routerPassword:"fixture"},()=>
    spawn(process.execPath,["-e",fixture.replace('ipAddress:value.ipAddress','ipAddress:"10.30.0.199"')],{stdio:["pipe","pipe","pipe"]}));
  try {await assert.rejects(observer.observe("10.30.0.194"),/mismatch/);}
  finally {observer.close();}
});
