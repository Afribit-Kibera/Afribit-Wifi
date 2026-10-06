import { randomUUID } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { db } from "../../lib/db";
import { voucherBatches, vouchers } from "../../lib/db/schema";
import { generateVoucherCode, hashVoucherCode, encryptVoucherCode } from "../../lib/voucher-crypto";
import { createPinnedRouter, readDaemonConfig, MeshCloudClient } from "../../gateway-agent/mesh-daemon";
async function main() {
  const config = readDaemonConfig(), router = createPinnedRouter(config), cloud = new MeshCloudClient(config);
  const host = await router.observe("10.30.0.197");
  const { joinUrl } = await cloud.createContext(host);
  const join = await fetch(joinUrl, { redirect:"manual" });
  if (join.status !== 303 || !join.headers.get("set-cookie")?.includes("HttpOnly")) throw new Error("Join failed");
  const cookie = join.headers.get("set-cookie")!.split(";")[0];
  const batchId=randomUUID(), voucherId=randomUUID(), code=generateVoucherCode();
  await writeFile(`artifacts/mesh-lab/private/automatic-setup/voucher-${voucherId}.json`,JSON.stringify({batchId,voucherId,code}),{mode:0o600,flag:"wx"});
  await db.batch([
    db.insert(voucherBatches).values({id:batchId,name:"Automatic-access commissioning (no sale)",quantity:1,saleAmountSats:0,
      accessDurationMinutes:3,speedLimitKbps:8192,createdBy:"lab-commissioning",prefix:"",maxRedemptions:1,validUntil:new Date(Date.now()+300_000)}),
    db.insert(vouchers).values({id:voucherId,batchId,codeHash:hashVoucherCode(code),codeCiphertext:encryptVoucherCode(code),codeLastFour:code.slice(-4)})
  ]);
  const redeem=async()=>fetch(config.cloudOrigin+"/api/vouchers/redeem",{method:"POST",headers:{cookie,"Content-Type":"application/json"},body:JSON.stringify({code})});
  const first=await redeem(), result=await first.json();
  if (!first.ok || !result.accessGrantId) throw new Error("Voucher handoff failed");
  const repeated=await redeem(), duplicate=await repeated.json();
  if (!repeated.ok || duplicate.accessGrantId!==result.accessGrantId) throw new Error("Duplicate voucher allowance");
  let state;
  for(let attempt=0;attempt<18;attempt++) {
    const response=await fetch(config.cloudOrigin+`/api/mesh/access/status?grant=${result.accessGrantId}`,{headers:{cookie},cache:"no-store"});
    state=await response.json();
    if(state.status==="active") break;
    await new Promise(resolve=>setTimeout(resolve,5000));
  }
  if(state.status!=="active") throw new Error("Router handoff unconfirmed");
  const report={checkedAt:new Date().toISOString(),routerId:config.routerId,ipAddress:host.ipAddress,grantId:result.accessGrantId,voucherId,
    sixDigitVoucher:true,oneConsumption:true,automaticRouterActivation:true,duplicateSameGrant:true,noCustomerCredentials:true,noPayment:true,...state};
  await writeFile("artifacts/mesh-lab/private/automatic-setup/cloud-verification.json",JSON.stringify(report,null,2));
  console.log(JSON.stringify(report));
}
main().catch(()=>{console.error("Cloud commissioning unconfirmed; inspect retained voucher/order without repeating the purchase");process.exitCode=1;});
