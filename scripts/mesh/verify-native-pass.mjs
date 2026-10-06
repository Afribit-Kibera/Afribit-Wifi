// Lab protocol verification. Requires md5.js downloaded from the target RouterOS.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const md5Path = process.argv[2] ?? 'artifacts/mesh-lab/native-pass-preparation/md5.js';
const md5 = fs.readFileSync(md5Path);
const template = fs.readFileSync('mikrotik/hotspot-mesh/commissioning/login.html', 'utf8');
const challenge = Buffer.from([0, 1, 9, 10, 13, 34, 39, 92, 127, 128, 129, 200, 222, 240, 254, 255]);
const id = Buffer.from([128]);
const octal = bytes => [...bytes].map(byte => '\\' + byte.toString(8).padStart(3, '0')).join('');
let missingMd5 = false;
let missingChallenge = false;
const server = http.createServer((request, response) => {
  const pathname = new URL(request.url, 'http://127.0.0.1').pathname;
  if (pathname === '/md5.js' && !missingMd5) {
    response.writeHead(200, { 'Content-Type': 'text/javascript' });
    response.end(md5);
  } else if (pathname === '/geist-latin.woff2') {
    response.writeHead(200, { 'Content-Type': 'font/woff2' });
    response.end(fs.readFileSync('mikrotik/hotspot-mesh/geist-latin.woff2'));
  } else if (pathname === '/commissioning/login') {
    const body = template
      .replaceAll('$(link-login-only)', '/commissioning/login')
      .replaceAll('$(link-status)', '/commissioning/status')
      .replaceAll('$(chap-id)', missingChallenge ? '' : octal(id))
      .replaceAll('$(chap-challenge)', missingChallenge ? '' : octal(challenge))
      .replace(/\$\(if error\)[\s\S]*?\$\(endif\)/, '');
    response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    response.end(body);
  } else {
    response.writeHead(404);
    response.end();
  }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
let browser;
try {
  browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(base + '/commissioning/login');
  assert.equal(await page.locator('#activate').isEnabled(), true);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  const username = 'KM-MESH-TRIAL-01';
  const password = 'FixturePass2026';
  const expected = crypto.createHash('md5').update(Buffer.concat([id, Buffer.from(password, 'ascii'), challenge])).digest('hex');
  let submitted;
  await page.route(base + '/commissioning/login', async route => {
    if (route.request().method() !== 'POST') return route.continue();
    submitted = new URLSearchParams(route.request().postData());
    await route.fulfill({ status: 200, contentType: 'text/html', body: '<p>Fixture accepted.</p>' });
  });
  await page.locator('#username').fill(' ' + username + ' ');
  await page.locator('#password').fill(password);
  await Promise.all([page.waitForURL(base + '/commissioning/login'), page.locator('#activate').click()]);
  assert(submitted, 'Native login was not submitted');
  assert.equal(submitted.get('username'), username);
  assert.equal(submitted.get('password'), expected, 'CHAP must hash exact byte sequences, including high bytes');
  assert.equal(submitted.get('dst'), '/commissioning/status');
  assert.equal(submitted.get('popup'), 'false');
  assert.equal([...submitted.keys()].length, 4);
  assert(![...submitted.values()].includes(password), 'Plaintext password must not leave the credential form');
  await page.unroute(base + '/commissioning/login');

  missingMd5 = true;
  await page.goto(base + '/commissioning/login');
  assert.equal(await page.locator('#activate').isDisabled(), true);
  missingMd5 = false;
  missingChallenge = true;
  await page.goto(base + '/commissioning/login');
  assert.equal(await page.locator('#activate').isDisabled(), true);
  const noJs = await browser.newContext({ javaScriptEnabled: false });
  const noJsPage = await noJs.newPage();
  await noJsPage.goto(base + '/commissioning/login');
  assert.equal(await noJsPage.locator('#activate').isDisabled(), true);
  assert.equal(await noJsPage.locator('#credentials input[name]').count(), 0);
  assert.deepEqual(errors, []);
  const result = { checkedAt: new Date().toISOString(), exactChapBytes: true, nativePostFields: true, plaintextNotSubmitted: true, missingHashAndChallengeFailClosed: true, noJavaScriptFailClosed: true, pageErrors: errors, md5Sha256: crypto.createHash('sha256').update(md5).digest('hex'), limitations: ['Fixture verifies protocol and form behavior; no live phone login or paid session was performed.'] };
  fs.mkdirSync('artifacts/mesh-lab/native-pass-preparation', { recursive: true });
  fs.writeFileSync(path.resolve('artifacts/mesh-lab/native-pass-preparation/browser-verification.json'), JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify(result));
} finally {
  if (browser) await browser.close();
  await new Promise(resolve => server.close(resolve));
}
