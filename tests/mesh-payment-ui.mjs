import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import { build } from 'esbuild';
import { chromium } from 'playwright';

// Bundle real client components in a local fixture. Next navigation/image/link
// are replaced only here; all payment HTTP calls are intercepted.
const bundle = await build({
  stdin: { contents: `
    import React from 'react'; import { createRoot } from 'react-dom/client';
    import { PortalExperience } from './components/portal-experience';
    import { PaymentStatus } from './components/payment-status';
    import { MeshConnectionStatus } from './components/mesh-connection-status';
    const query=new URLSearchParams(location.search);
    const methods=query.get('unavailable')==='1'?[]:query.get('single')==='1'?[{id:'paystack',label:'M-Pesa',currency:'KES'}]:[{id:'btcpay',label:'Bitcoin · Lightning',currency:'BTC'},...(query.get('backup')==='1'?[{id:'paystack',label:'M-Pesa backup',currency:'KES'}]:[]),...(query.get('bitika')==='0'?[]:[{id:'bitika',label:'M-Pesa',currency:'KES'}])];
    const context={macAddress:query.get('missingContext')==='1'?'unknown':'02:11:22:33:44:55',ipAddress:'10.30.0.199',routerId:'mesh-fixture-001',loginUrl:'http://10.30.0.1/login'};
    const catalogue=[[10,80],[15,120],[20,240],[30,1440],[55,2880],[85,4320],[140,10080],[230,20160],[450,43200]].map(([priceKes,durationMinutes],index)=>({id:'00000000-0000-4000-8000-'+String(index+1).padStart(12,'0'),name:'Catalogue fixture',description:null,priceKes,priceSats:100,durationMinutes,speedLimitKbps:8192}));
    createRoot(document.getElementById('root')).render(query.get('screen')==='connected'
      ? <main className="mesh-flow"><section className="mesh-flow-card"><MeshConnectionStatus state="pending" paymentId="00000000-0000-4000-8000-000000000001"/></section></main>
      : query.get('screen')==='status'
      ? <main className="mesh-flow"><section className="mesh-flow-card"><PaymentStatus paymentId="00000000-0000-4000-8000-000000000001" initialStatus="processing" checkoutUrl="/pay/fixture" provider={query.get('native')==='1'?'paystack':'bitika'} initialResolutionRequired={!query.has('phase')} initialProviderStatus={query.get('phase')??undefined} initialCollectionConfirmed={query.get('native')!=='1'&&!query.has('phase')} initialNativeAccess={query.get('native')==='1'?{status:'pending',expiresAt:null}:null}/></section></main>
      : <PortalExperience packages={query.get('catalogue')==='1'?catalogue:[{id:'00000000-0000-4000-8000-000000000001',name:'Fixture pass',description:'Everyday browsing',priceKes:100,priceSats:1000,durationMinutes:60,speedLimitKbps:2000}]} portalContext={context} initialView="internet" paymentMethods={methods}/>);
  `, resolveDir: process.cwd(), loader: 'tsx' },
  bundle: true, write: false, platform: 'browser', format: 'iife', jsx: 'automatic', define: { 'process.env.NODE_ENV': '"production"' },
  plugins: [{ name: 'fixture-next', setup(builder) {
    builder.onResolve({ filter: /^next\/(navigation|image|link)$/ }, args => ({ path: args.path, namespace: 'fixture' }));
    builder.onLoad({ filter: /.*/, namespace: 'fixture' }, args => ({ contents: args.path === 'next/navigation'
      ? 'export function useRouter(){return {push:path=>location.assign(path)}}'
      : args.path === 'next/link'
        ? 'import React from "react";export default function Link({prefetch,replace,children,...props}){return <a {...props}>{children}</a>}'
        : 'import React from "react";export default function Image({fill,priority,quality,style,...props}){return <img {...props} style={{...(fill?{position:"absolute",inset:0,width:"100%",height:"100%"}:{}),...style}}/>}', loader: 'tsx', resolveDir: process.cwd() }));
  } }],
});
const styles = fs.readFileSync('app/mesh-portal.css', 'utf8') + fs.readFileSync('app/mesh-flow.css', 'utf8');
const server = http.createServer((request, response) => {
  const pathname = new URL(request.url, 'http://localhost').pathname;
  if (pathname === '/') { response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); response.end('<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/styles.css"></head><body><div id="root"></div><script src="/app.js"></script></body></html>'); }
  else if (pathname === '/app.js') { response.writeHead(200, { 'Content-Type': 'text/javascript' }); response.end(bundle.outputFiles[0].contents); }
  else if (pathname === '/styles.css') { response.writeHead(200, { 'Content-Type': 'text/css' }); response.end('@font-face{font-family:Geist;src:url(/geist.woff2)}*{box-sizing:border-box}body{margin:0;font-family:Geist,Arial}a{text-decoration:none}button,input{font:inherit}:root{--font-sans:Geist}' + styles); }
  else if (pathname === '/geist.woff2') { response.writeHead(200, { 'Content-Type': 'font/woff2' }); response.end(fs.readFileSync('mikrotik/hotspot-mesh/geist-latin.woff2')); }
  else if (pathname === '/images/mesh-neighborhood.webp') { response.writeHead(200, { 'Content-Type': 'image/webp' }); response.end(fs.readFileSync('public/images/mesh-neighborhood.webp')); }
  else if (pathname === '/images/payments/mpesa.svg') { response.writeHead(200, { 'Content-Type': 'image/svg+xml' }); response.end(fs.readFileSync('public/images/payments/mpesa.svg')); }
  else { response.writeHead(404); response.end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = 'http://127.0.0.1:' + server.address().port;
const output = 'artifacts/mesh-lab/bitika-reference/ui';
fs.mkdirSync(output, { recursive: true });
let browser;
try {
  browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  const results = [];
  for (const width of [320, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 844 } });
    const errors = [];
    const attempts = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(base+'/?catalogue=1&single=1');
    await page.getByRole('heading',{name:'Get online.',exact:true}).waitFor();
    assert.equal(await page.locator('.mesh-hero,.mesh-hero-image,.mesh-tabs').count(),0,'Purchase entry must not show the old welcome page or request its hero image');
    assert.equal(await page.getByRole('img',{name:'M-PESA',exact:true}).count(),1,'Payment method must use the local official M-PESA mark');
    assert.equal(await page.locator('.mesh-free-entry').count(),0,'The captive redirect action must be removed');
    await page.getByRole('button', { name: 'Mesh home' }).click();
    assert.equal(await page.locator('.mesh-hero,.mesh-tabs').count(),0,'Mesh logo must keep the current catalogue');
    assert.equal(await page.locator('.mesh-plan').count(),9,'All catalogue prices must be immediately available');
    assert.equal(await page.evaluate(()=>scrollY),0,'Purchase entry must not jump down after mounting');
    assert.equal(await page.locator('.mesh-plan').first().evaluate(element=>element.getBoundingClientRect().bottom<innerHeight),true,'Prices must appear in the first viewport');
    assert.equal(await page.locator('.mesh-payment-methods').count(),0,'A single payment method needs no extra choice');
    const continueButton=page.getByRole('button',{name:'Continue',exact:true});
    assert.equal(await continueButton.evaluate(element=>element.getBoundingClientRect().bottom<=innerHeight),true,'Checkout action must stay visible below the price catalogue');
    await continueButton.click();
    await page.getByLabel('M-Pesa phone number').waitFor();
    assert.equal(await page.getByLabel('M-Pesa phone number').evaluate(element=>document.activeElement===element),true);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    await page.screenshot({path:output+'/catalogue-'+width+'.png',fullPage:true});
    await page.route('**/api/payments', async route => { attempts.push(route.request().postDataJSON()); await route.fulfill({ status: 503, json: { error: 'Could not confirm the request. Check before paying again.' } }); });
    await page.route('**/api/payments/*', route => route.fulfill({ json: { status: 'processing', provider: 'bitika', collectionConfirmed: true, resolutionRequired: true } }));
    await page.goto(base+'/?backup=1');
    assert.equal(await page.getByRole('radio', { name: 'M-Pesa', exact: true }).count(),1,'Fallback providers must remain one customer payment method');
    assert(!await page.locator('body').textContent().then(text=>/backup|Paystack|Bitika/.test(text)),'Provider routing must not appear in customer copy');
    await page.getByRole('radio', { name: 'M-Pesa', exact: true }).check();
    assert.equal(await page.getByRole('button', { name: /with M-Pesa/ }).isEnabled(), true);
    await page.getByRole('button', { name: /with M-Pesa/ }).click();
    await page.getByRole('alert').waitFor();
    assert.match(await page.getByRole('alert').textContent(),/Enter your M-Pesa phone number/);
    assert.equal(attempts.length,0,'Empty phone validation must never request a payment');
    await page.getByLabel('M-Pesa phone number').fill('071234567');
    await page.getByRole('button', { name: /with M-Pesa/ }).click();
    assert.equal(attempts.length,0,'An incomplete phone must never request a payment');
    await page.getByLabel('M-Pesa phone number').fill('0712345678');
    await page.getByRole('button', { name: /with M-Pesa/ }).click();
    await page.getByRole('alert').waitFor();
    await page.getByRole('button', { name: /with M-Pesa/ }).click();
    await page.getByRole('alert').waitFor();
    assert.equal(attempts.length, 2);
    assert.equal(attempts[0].provider, 'bitika');
    assert.equal(attempts[0].requestId, attempts[1].requestId, 'Retry must retain the logical payment reference');
    assert.equal(attempts[0].routerId, 'mesh-fixture-001');
    assert.equal(attempts[0].phone, '0712345678');
    assert.equal(await page.locator('.mesh-checkout input[type=password]').count(), 0);
    const retained = await page.evaluate(() => sessionStorage.getItem('mesh:payment-request'));
    assert(!retained.includes('0712345678'), 'Browser storage must not contain the phone');
    await page.reload();
    await page.getByRole('radio', { name: 'M-Pesa', exact: true }).check();
    await page.getByLabel('M-Pesa phone number').fill('0712345678');
    await page.getByRole('button', { name: /with M-Pesa/ }).click();
    await page.getByRole('alert').waitFor();
    assert.equal(attempts[2].requestId, attempts[0].requestId, 'Ambiguous request must keep its reference after a reload');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.locator('.mesh-checkout').screenshot({ path: `${output}/mpesa-checkout-${width}.png` });
    await page.getByRole('button', { name: 'Have a voucher?' }).click();
    const voucher = page.getByLabel('Voucher code', { exact: true });
    await voucher.fill('01234');
    assert.equal(await page.getByRole('button', { name: 'Use voucher', exact: true }).isDisabled(), true);
    await voucher.fill('012345');
    assert.equal(await page.getByRole('button', { name: 'Use voucher', exact: true }).isEnabled(), true);
    assert.equal(await voucher.getAttribute('inputmode'), 'numeric');
    assert.equal(await voucher.inputValue(), '012345', 'Leading zero must remain part of a six-digit voucher');
    await page.goto(base + '/?screen=status');
    await page.getByRole('heading', { name: 'We’re checking your purchase.' }).waitFor();
    assert.match(await page.locator('.flow-copy').textContent(), /Don’t pay again/);
    assert.equal(await page.getByRole('link', { name: 'Open Bitcoin checkout' }).count(), 0);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.screenshot({ path: `${output}/payment-resolution-${width}.png` });
    await page.unroute('**/api/payments/*');
    let paymentEvidence={status:'processing',provider:'paystack',providerStatus:'ongoing',collectionConfirmed:false,nativeAccess:{status:'pending',expiresAt:null}};
    await page.route('**/api/payments/*',route=>route.fulfill({json:paymentEvidence}));
    await page.goto(base+'/?screen=status&native=1&phase=ongoing');
    await page.getByRole('heading',{name:'Approve the M-Pesa prompt.',exact:true}).waitFor();
    assert.match(await page.locator('.flow-copy').textContent(),/Wait for the M-Pesa prompt/);
    assert(!await page.locator('.flow-copy').textContent().then(text=>text.includes('Payment received')),'Unpaid pending reservation must never claim payment was received');
    assert.equal(await page.getByRole('link',{name:'Start browsing',exact:true}).count(),0,'Completion probe is only available after router activation');
    paymentEvidence={...paymentEvidence,providerStatus:'success',collectionConfirmed:true};
    await page.getByRole('heading',{name:'Payment received.',exact:true}).waitFor({timeout:6000});
    assert.equal(await page.getByRole('link',{name:'Start browsing',exact:true}).count(),0);
    await page.screenshot({path:output+'/confirming-payment-'+width+'.png',fullPage:true});
    await page.unroute('**/api/payments/*');
    let nativeStatus = 'pending', nativeExpiry;
    await page.route('**/api/payments/*', route => route.fulfill({ json: { status: 'settled', provider: 'paystack', nativeAccess: { status: nativeStatus, expiresAt: nativeExpiry ?? new Date(Date.now() + 300_000).toISOString() } } }));
    await page.goto(base + '/?screen=status&native=1');
    await page.getByRole('heading', { name: 'Turning on your internet.' }).waitFor();
    await page.waitForTimeout(2700);
    assert(page.url().includes('screen=status'), 'Settled payment must wait for router acknowledgement');
    assert.equal(await page.locator('input').count(), 0, 'Automatic access must never ask for router credentials');
    nativeStatus = 'active';
    await page.getByRole('heading', { name: 'You’re online.', exact:true }).waitFor({ timeout:6000 });
    assert(page.url().includes('screen=status'),'Success must display a clear confirmation instead of immediately skipping to another page');
    assert.equal(await page.getByRole('link',{name:'Start browsing',exact:true}).count(),1);
    await page.waitForTimeout(5100);
    assert(page.url().includes('screen=status'),'Normal browsers must keep the success receipt, not automatically navigate to an OS probe');
    await page.screenshot({path:output+'/internet-ready-'+width+'.png',fullPage:true});
    nativeStatus = 'failed';
    await page.goto(base + '/?screen=status&native=1');
    await page.getByRole('heading', { name: 'We’re checking your purchase.' }).waitFor();
    assert.match(await page.locator('.flow-copy').textContent(), /Don’t pay again/);
    nativeStatus = 'active';
    await page.getByRole('heading', {name:'You’re online.',exact:true}).waitFor({timeout:6000});
    nativeExpiry = new Date(Date.now()+1000).toISOString();
    await page.reload();
    await page.getByRole('heading', {name:'You’re online.',exact:true}).waitFor();
    await page.getByRole('heading', {name:'Your pass has ended.',exact:true}).waitFor({timeout:4000});
    nativeExpiry = undefined;
    nativeStatus = 'expired';
    await page.goto(base + '/?screen=status&native=1');
    await page.getByRole('heading', { name: 'Your pass has ended.' }).waitFor();
    let connectionStatus = 'active';
    let connectionExpiry = new Date(Date.now() + 300_000).toISOString();
    await page.route('**/api/mesh/access/status?*', route => route.fulfill({ json: { status: connectionStatus, expiresAt: connectionExpiry } }));
    await page.goto(base + '/?screen=connected');
    await page.getByRole('heading', { name: 'You’re online.' }).waitFor();
    assert.equal(await page.getByRole('link',{name:'Start browsing',exact:true}).getAttribute('href'),'http://captive.apple.com/hotspot-detect.html');
    assert.match(await page.locator('.flow-note').textContent(),/tap Done or close it, then open your browser/);
    connectionExpiry = new Date(Date.now() - 1000).toISOString();
    await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
    await page.getByRole('heading', { name: 'Your pass isn’t active.' }).waitFor({ timeout: 10_000 });
    connectionStatus = 'pending';
    connectionExpiry = new Date(Date.now() + 300_000).toISOString();
    await page.goto(base + '/?screen=connected');
    await page.getByRole('heading', { name: 'Turning on your internet.' }).waitFor();
    await page.goto(base + '/?bitika=0');
    await page.getByRole('button', { name: 'Pay with bitcoin', exact: true }).waitFor();
    assert.equal(await page.getByRole('radio', { name: 'M-Pesa', exact: true }).count(), 0);
    await page.goto(base+'/?unavailable=1');
    assert.equal(await page.getByRole('button',{name:'Payments temporarily unavailable',exact:true}).isDisabled(),true);
    assert.equal(await page.getByRole('button',{name:'Pay with bitcoin',exact:true}).count(),0,'Unavailable providers must not masquerade as a Bitcoin checkout');
    await page.getByText('No payment methods are available just now.',{exact:false}).waitFor();
    await page.goto(base+'/?single=1&missingContext=1');
    assert.equal(await page.getByRole('button',{name:'Reconnect to Mesh to pay',exact:true}).isDisabled(),true);
    assert.equal(await page.getByRole('link',{name:'Reconnect to Mesh checkout'}).getAttribute('href'),'http://10.30.0.1/login');
    assert.deepEqual(errors, []);
    results.push({ width, retryReferencePreserved: true, reloadReferencePreserved: true, phoneAbsentFromStorage: true, correctRouterContext: true, noPinField: true, resolutionCopy: true, sixDigitVoucher: true, waitsForRouterActivation: true, noRouterCredentialFields: true, nativeFailureDoesNotAskForPayment: true, repairedAccessRecoversAutomatically: true, paymentReceiptHonorsExpiredDeadline: true, ordinaryBrowserRetainsSuccessReceipt: true, nativeExpiryShown: true, connectedPollsRouterAcknowledgement: true, connectedHonorsExpiredDeadline: true, disabledProviderAbsent: true, horizontalOverflow: false, pageErrors: errors });
    await page.close();
  }
  const captive = await browser.newPage({ viewport:{width:390,height:844}, userAgent:'Android CaptivePortalLogin' });
  let captiveStatus = 'pending', probeRequests = 0;
  await captive.route('**/api/payments/*', route => route.fulfill({ json:{status:'settled',provider:'bitika',nativeAccess:{status:captiveStatus,expiresAt:new Date(Date.now()+300_000).toISOString()}} }));
  await captive.route('http://connectivitycheck.gstatic.com/generate_204', route => { probeRequests++; return route.fulfill({status:204,body:''}); });
  await captive.goto(base+'/?screen=status&native=1');
  await captive.getByRole('heading',{name:'Turning on your internet.',exact:true}).waitFor();
  await captive.waitForTimeout(5200);
  assert.equal(probeRequests,0,'Even a captive browser must never request successful handoff before router acknowledgement');
  captiveStatus = 'active';
  await captive.getByRole('heading',{name:'You’re online.',exact:true}).waitFor({timeout:6000});
  await captive.getByRole('button',{name:'Stay on this page',exact:true}).click();
  await captive.waitForTimeout(5200);
  assert.equal(probeRequests,0,'Customer can cancel the automatic captive handoff and retain confirmation');
  await captive.reload();
  await captive.getByRole('heading',{name:'You’re online.',exact:true}).waitFor();
  await captive.waitForTimeout(5500);
  assert.equal(probeRequests,1,'Identified captive browser rechecks its OS probe after acknowledged success');
  results.push({identifiedCaptiveHandoff:true,routerAcknowledgementRequired:true,handoffCanBeCancelled:true});
  await captive.close();
  for (const scenario of [{status:503,matches:true,recover:true},{status:503,matches:false,recover:false},{status:409,matches:true,recover:false}]) {
    const checkout = await browser.newPage({viewport:{width:390,height:844}});
    let postCount=0, requestId;
    await checkout.route('**/api/payments',route=>{
      postCount++;
      requestId=route.request().postDataJSON().requestId;
      return route.fulfill({status:scenario.status,json:{error:'We’re checking your request. Don’t pay again.',paymentId:scenario.matches?requestId:'00000000-0000-4000-8000-000000000002',checkoutUrl:'https://untrusted.invalid/pay'}});
    });
    await checkout.route('**/pay/*',route=>route.fulfill({contentType:'text/html',body:'<h1>Checking your purchase</h1>'}));
    await checkout.goto(base+'/?single=1');
    await checkout.getByLabel('M-Pesa phone number').fill('0712345678');
    await checkout.getByRole('button',{name:/with M-Pesa/}).click();
    if(scenario.recover) {
      await checkout.waitForURL('**/pay/*');
      assert.equal(new URL(checkout.url()).pathname,'/pay/'+requestId,'Ambiguous payment recovers only its locally retained request, never an untrusted checkout URL');
      await checkout.getByRole('heading',{name:'Checking your purchase'}).waitFor();
    } else {
      await checkout.getByRole('alert').waitFor();
      assert.equal(new URL(checkout.url()).pathname,'/','Mismatched or device-conflict references cannot open another purchase');
    }
    assert.equal(postCount,1,'Recovery must never send a second collection request');
    results.push({ambiguousCheckoutStatus:scenario.status,samePurchase:scenario.matches,recoveryOpened:scenario.recover,noDuplicateChargeRequest:true});
    await checkout.close();
  }
  fs.writeFileSync(`${output}/verification.json`, JSON.stringify({ checkedAt: new Date().toISOString(), results, limitations: ['Local client fixture with intercepted payment calls; no live money, production database or router changes.'] }, null, 2));
  console.log(JSON.stringify({ results }));
} finally {
  if (browser) await browser.close();
  await new Promise(resolve => server.close(resolve));
}
