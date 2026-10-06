import { chromium } from 'playwright';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import assert from 'node:assert/strict';

(async () => {
  let site = null;
  const shell = path.resolve('mikrotik/hotspot-mesh');
  const output = path.resolve('artifacts/mesh-lab/mesh-captive-review');
  fs.mkdirSync(output, { recursive: true });
  const fixture = {
    '$(mac)': 'AA:BB:CC:DD:EE:FF',
    '$(ip)': '10.30.0.15',
    '$(link-login)': 'http://login.mesh.example/login',
    '$(link-login-only)': 'http://login.mesh.example/login',
    '$(link-logout)': 'http://login.mesh.example/logout',
    '$(uptime)': '1m',
    '$(session-time-left)': '59m',
    '$(link-orig)': 'https://example.net/read?theme=light&lang=sw',
  };
  const source = fs.readFileSync(path.join(shell, 'login.html'), 'utf8');
  for (const marker of ['$(mac)', '$(ip)', '$(link-login)', '$(link-orig)']) assert(source.includes(marker), 'Template marker missing: ' + marker);
  const server = http.createServer((request, response) => {
    const pathname = new URL(request.url, 'http://127.0.0.1').pathname;
    const name = pathname === '/' ? 'login.html' : pathname.slice(1);
    if (!['login.html', 'mesh.html', 'explore.html', 'site-config.js', 'error.html', 'status.html', 'fstatus.html', 'geist-latin.woff2', 'bitcoin.svg', 'blink.svg', 'signal.svg', 'learn-bitcoin.jpg', 'learn-community.jpg', 'learn-diploma.jpg', 'mesh-kibera-market-960.jpg', 'mesh-kibera-market-1440.jpg', 'mesh-kibera-market-3840.jpg'].includes(name)) { response.writeHead(404); response.end(); return; }
    if (name.endsWith('.jpg') || name.endsWith('.woff2') || name.endsWith('.svg')) {
      response.writeHead(200, { 'Content-Type': name.endsWith('.jpg') ? 'image/jpeg' : name.endsWith('.svg') ? 'image/svg+xml' : 'font/woff2' });
      response.end(fs.readFileSync(path.join(shell, name)));
      return;
    }
    let body = name === 'site-config.js' && site ? 'window.MESH_SITE=Object.freeze(' + JSON.stringify(site) + ');' : fs.readFileSync(path.join(shell, name), 'utf8');
    if (name === 'status.html' || name === 'fstatus.html') {
      const active = new URL(request.url, 'http://127.0.0.1').searchParams.get('active') === '1';
      // Render the documented RouterOS branches, including the nested clock.
      body = body.replace(/\$\(if session-time-left\)([\s\S]*?)\$\(endif\)/g, '$1');
      body = body.replace(/\$\(if logged-in == yes\)([\s\S]*?)\$\(else\)([\s\S]*?)\$\(endif\)/g, (_, loggedIn, loggedOut) => active ? loggedIn : loggedOut);
    }
    for (const [marker, value] of Object.entries(fixture)) body = body.replaceAll(marker, value);
    response.writeHead(200, { 'Content-Type': name.endsWith('.js') ? 'text/javascript' : 'text/html; charset=utf-8' });
    response.end(body);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + server.address().port;
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
    const page = await context.newPage();
    const failures = [];
    page.on('pageerror', error => failures.push(error.message));
    let cloud = null;
    let requests = [];
    page.on('request', request => requests.push(request.url()));
    await context.route('https://wifi.afribit.africa/**', route => {
      cloud = new URL(route.request().url());
      return route.fulfill({ status: 200, contentType: 'text/html', body: '<p>Captured preview only</p>' });
    });
    await page.goto(base);
    for (const id of ['buy', 'voucher']) assert(await page.locator('#' + id).isDisabled(), 'Default capability enabled: ' + id);
    assert(await page.getByRole('heading', { name: 'Powered by Bitcoin.' }).isVisible());
    assert(await page.getByRole('link', { name: 'Mesh welcome' }).isVisible());
    assert.equal(await page.locator('#use-mesh-free').count(), 0);
    assert.equal(await page.getByRole('link', { name: 'Mesh welcome' }).getAttribute('href'), '#welcome-heading');
    assert.equal(await page.locator('.app-card img').count(), 2);
    assert(await page.locator('.app-card img').evaluateAll(images => images.every(image => image.complete && image.naturalWidth > 0)), 'Official app logos failed to load locally');
    assert.equal(await page.locator('#learn .learning-card').count(), 4);
    assert.equal(await page.getByRole('link', { name: /Bitcoin Diploma/ }).getAttribute('href'), 'https://bitcoinekasi.com/wp-content/uploads/2025/03/bitcoin-diploma-2025-pdf.pdf');
    assert.equal(await page.locator('#explore,#blink,#community-board').count(), 0, 'App navigation returned to the captive');
    assert(await page.locator('.hero-photo').evaluate(image => image.complete && image.naturalWidth > 0 && image.currentSrc.includes('mesh-kibera-market-960.jpg')), 'Local background photo did not load');
    assert(await page.locator('.hero-photo').evaluate(image => getComputedStyle(image).position === 'absolute'), 'Photo is not part of the hero background');
    await page.evaluate(() => document.fonts.ready);
    assert(await page.evaluate(() => Array.from(document.fonts).some(font => font.family === 'Geist' && font.status === 'loaded')), 'Locally hosted Geist did not load');
    assert((await page.locator('#billing-state').textContent()).includes('temporarily unavailable'), 'Disabled purchase explanation missing');
    assert(requests.every(url => new URL(url).origin === base), 'Default shell made an external request');
    for (const width of [320, 390, 430, 580]) {
      await page.setViewportSize({ width, height: 844 });
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), 'Horizontal overflow: ' + width);
    }
    for (const [width, height] of [[320, 568], [390, 844]]) {
      await page.setViewportSize({ width, height });
      assert(await page.locator('#buy').evaluate(button => {
        const box = button.getBoundingClientRect();
        return box.top >= 0 && box.bottom <= window.innerHeight;
      }), 'Internet pass action is below the first viewport: ' + width + 'x' + height);
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: path.join(output, 'mesh-local-welcome-mobile.png'), fullPage: true });
    site = { locationLabel: 'Kibera · East', routerId: 'mesh-lab-001', billingReady: true, localDirectoryUrl: 'http://local.mesh.example/', blinkAccessVerified: true };
    await page.goto(base);
    for (const id of ['buy', 'voucher']) assert(await page.locator('#' + id).isDisabled(), 'Legacy browser context must not enable checkout: ' + id);
    assert.equal(await page.locator('#explore,#blink').count(), 0, 'Legacy config exposed app navigation');
    await page.screenshot({ path: path.join(output, 'mesh-welcome-checkout-preview.png'), fullPage: true });
    await page.setViewportSize({ width: 320, height: 568 });
    assert(await page.locator('#buy').evaluate(button => button.getBoundingClientRect().bottom <= window.innerHeight), 'Enabled checkout action is below the small-phone fold');
    await page.screenshot({ path: path.join(output, 'mesh-welcome-checkout-small-phone.png'), fullPage: false });
    await page.setViewportSize({ width: 390, height: 844 });
    const smallTargets = await page.locator('button,a,summary').evaluateAll(elements => elements.filter(element => {
      const height = element.getBoundingClientRect().height;
      return height > 0 && height < 44;
    }).map(element => element.textContent.trim()));
    assert.deepEqual(smallTargets, [], 'Targets shorter than 44px');
    assert.equal(cloud, null, 'Legacy configuration must not send unsigned customer context');
    site = { billingReady: true, routerId: 'KM-LAB-001', automaticJoinUrl: 'http://10.20.0.10:8040/start' };
    await page.goto(base);
    for (const id of ['buy', 'voucher']) assert(await page.locator('#' + id).isDisabled(), 'Plain HTTP must not enable checkout: ' + id);
    site = { billingReady: true, routerId: 'KM-LAB-001', automaticJoinUrl: 'https://mesh-core.afribit.africa/start' };
    let finishJoin;
    const delayedJoin = new Promise(resolve => { finishJoin = resolve; });
    let joinRequest;
    await page.route('https://mesh-core.afribit.africa/start?*', async route => {
      joinRequest = new URL(route.request().url());
      await delayedJoin;
      await route.fulfill({ contentType: 'text/html', body: '<h1>Automatic checkout handoff</h1>' });
    });
    await page.goto(base);
    // Inspect the synchronous submit feedback before Playwright waits for the
    // deliberately stalled navigation to complete.
    const openingState = await page.evaluate(() => {
      document.getElementById('buy').click();
      return { message: document.getElementById('billing-state').textContent,
        disabled: document.getElementById('buy').disabled,
        busy: document.getElementById('buy').getAttribute('aria-busy') };
    });
    assert(openingState.message.includes('Stay connected to Mesh.'), 'Pending handoff needs clear connection instructions');
    assert(openingState.disabled, 'A pending navigation must prevent duplicate taps');
    assert.equal(openingState.busy, 'true');
    finishJoin();
    await page.waitForURL('https://mesh-core.afribit.africa/start?*');
    assert.deepEqual([...joinRequest.searchParams.keys()], ['view'], 'Automatic join must ignore browser-supplied device identifiers');
    assert.equal(joinRequest.searchParams.get('view'), 'internet');
    await page.goto(base);
    await page.locator('#voucher').click();
    await page.waitForURL('https://mesh-core.afribit.africa/start?*');
    assert.equal(joinRequest.searchParams.get('view'), 'voucher');
    assert.deepEqual([...joinRequest.searchParams.keys()], ['view']);
    await page.goto(base + '/mesh.html');
    assert(await page.getByRole('heading', { name: 'Come back anytime.' }).isVisible());
    assert.equal(await page.locator('.address').textContent(), base + '/mesh.html');
    assert(await page.getByRole('link', { name: 'View internet pass', exact: true }).isVisible());
    assert.equal(await page.getByRole('link', { name: 'View internet pass', exact: true }).getAttribute('href'), './status');
    for (const width of [320, 390, 430]) {
      await page.setViewportSize({ width, height: 568 });
      assert(await page.locator('#buy').evaluate(button => {
        const box=button.getBoundingClientRect();return box.top>=0&&box.bottom<=window.innerHeight;
      }), 'Persistent purchase action must stay visible');
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
    }
    await page.screenshot({ path: path.join(output, 'mesh-persistent-purchase-mobile.png'), fullPage: true });
    await page.locator('#buy').click();
    await page.waitForURL('https://mesh-core.afribit.africa/start?*');
    assert.deepEqual([...joinRequest.searchParams.keys()], ['view'], 'Persistent entry must obtain fresh attestation, not pass device fields');
    await page.unroute('https://mesh-core.afribit.africa/start?*');
    site = { billingReady: true, routerId: '../invalid', localDirectoryUrl: 'javascript:alert(1)', blinkAccessVerified: false };
    await page.goto(base);
    assert(await page.locator('#buy').isDisabled(), 'Invalid router ID enabled billing');
    // Welcome and purchase remain usable as a document even if its configuration or image fails.
    await page.route('**/site-config.js', route => route.abort());
    await page.route('**/mesh-kibera-market-*.jpg', route => route.abort());
    await page.goto(base);
    assert(await page.getByRole('heading', { name: 'Welcome to Mesh.' }).isVisible());
    assert(await page.locator('#buy').isDisabled(), 'Missing config enabled billing');
    assert(await page.locator('#voucher').isDisabled());
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
    await page.unroute('**/site-config.js');
    await page.unroute('**/mesh-kibera-market-*.jpg');
    await page.goto(base + '/fstatus.html');
    assert(await page.getByRole('heading', { name: 'No active pass.', exact: true }).isVisible());
    assert.equal(await page.getByRole('heading', { name: 'Your pass is active.', exact: true }).count(), 0, 'Unauthenticated status must not promise internet');
    assert(await page.getByText(/Do not pay again while it is being confirmed/).isVisible());
    await page.goto(base + '/status.html?active=1');
    assert(await page.getByRole('heading', { name: 'Your pass is active.', exact: true }).isVisible());
    assert.equal(await page.getByText('59m', { exact: true }).count(), 1);
    assert.equal(await page.getByRole('heading', { name: 'No active pass.', exact: true }).count(), 0);
    assert(await page.getByText(/not a speed test/).isVisible());
    await page.goto(base + '/explore.html');
    assert(await page.locator('#community-board').isDisabled(), 'Unconfigured board enabled');
    assert(await page.locator('#browser-handoff').isHidden(), 'Unconfigured browser address exposed');
    site = { communityBoardUrl: 'javascript:alert(1)' };
    await page.reload();
    assert(await page.locator('#community-board').isDisabled(), 'Unsafe board URL enabled');
    site = { communityBoardUrl: 'http://user:password@local.mesh.example/' };
    await page.reload();
    assert(await page.locator('#community-board').isDisabled(), 'Credentials in board URL accepted');
    assert(await page.locator('#browser-handoff').isHidden(), 'Credential-bearing browser address exposed');
    site = { communityBoardUrl: base + '/status.html' };
    await page.reload();
    assert(!(await page.locator('#community-board').isDisabled()), 'Configured local board disabled');
    assert(await page.locator('#browser-handoff').isVisible(), 'Full-browser instructions unavailable');
    assert.equal(await page.locator('#browser-address').textContent(), base + '/status.html');
    await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true }));
    await page.locator('#board-address-action').click();
    assert.equal(await page.evaluate(() => window.getSelection().toString()), base + '/status.html', 'HTTP clipboard fallback did not select address');
    assert((await page.locator('#board-copy-status').textContent()).includes('Choose Copy'), 'Manual copy instructions missing');
    for (const width of [320, 390, 430, 580]) {
      await page.setViewportSize({ width, height: 844 });
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), 'Directory horizontal overflow: ' + width);
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: path.join(output, 'mesh-local-directory-mobile.png'), fullPage: true });
    await page.locator('#community-board').click();
    await page.waitForURL(base + '/status.html');
    assert.deepEqual(failures, [], 'Browser script errors');
    const offlineContext = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 320, height: 800 } });
    const offlinePage = await offlineContext.newPage();
    await offlinePage.goto(base);
    assert(await offlinePage.getByRole('heading', { name: 'Welcome to Mesh.' }).isVisible());
    assert(await offlinePage.locator('#buy').isDisabled());
    assert(await offlinePage.locator('.hero-photo').evaluate(image => image.complete && image.naturalWidth > 0));
    const retinaContext = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 });
    const retinaPage = await retinaContext.newPage();
    await retinaPage.goto(base);
    assert(await retinaPage.locator('.hero-photo').evaluate(image => image.complete && image.currentSrc.includes('mesh-kibera-market-1440.jpg')), 'Retina phone did not choose a responsive photo');
    await retinaContext.close();
    const bytes = fs.readdirSync(shell).reduce((total, name) => total + fs.statSync(path.join(shell, name)).size, 0);
    const result = {
      checkedAt: new Date().toISOString(),
      defaultGates: true, defaultLocalRequestsOnly: true, configuredActions: true,
      welcomeAndPurchaseOnly: true, bitcoinAndAfribitVisible: true, localArtworkLoaded: true,
      backgroundHero: true, passActionInFirstViewport: ['320x568', '390x844'],
      localGeistLoaded: true, retinaPhoneUsesResponsiveImage: true,
      missingConfigAndImageSafe: true,
      persistentPurchaseEntry: true,
      internetContextPreserved: true, voucherSingleView: true, invalidConfigRejected: true,
      targetsAtLeast44px: true, javaScriptDisabledWelcomeVisible: true,
      fullBrowserHandoff: true, insecureClipboardFallback: true,
      viewportWidths: [320, 390, 430, 580], pageErrors: failures, bundleBytes: bytes,
      limitations: ['RouterOS rendering and real captive browser behavior are not tested', 'No router files, SSIDs or firewall configuration changed'],
    };
    fs.writeFileSync(path.join(output, 'verification.json'), JSON.stringify(result, null, 2));
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exit(1); });
