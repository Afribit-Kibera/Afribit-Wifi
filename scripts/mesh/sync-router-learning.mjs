// Keep the two router pages' visual learning links identical.
import fs from 'node:fs';
const login = fs.readFileSync('mikrotik/hotspot-mesh/login.html', 'utf8');
const section = login.match(/      <section class="learn" id="learn"[\s\S]*?      <\/section>/)?.[0];
if (!section) throw new Error('Learning section unavailable');
const file = 'mikrotik/hotspot-mesh/mesh.html';
let body = fs.readFileSync(file, 'utf8');
body = body.replace(/      <section class="learn" id="learn"[\s\S]*?      <\/section>\r?\n?/, '');
body = body.replace('    <section class="note"><h2>Ready to get online?</h2>', section + '\n    <section class="note"><h2>Ready to get online?</h2>');
fs.writeFileSync(file, body);
