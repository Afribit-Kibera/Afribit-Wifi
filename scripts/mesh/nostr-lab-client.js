// Thin lab UI; signing, verification and relay transport use nostr-tools.
import { finalizeEvent, generateSecretKey, getPublicKey } from 'nostr-tools/pure';
import { SimplePool } from 'nostr-tools/pool';

const relays = ['/relays/primary', '/relays/hp'].map(path => {
  const url = new URL(path, window.location.href);
  url.protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return url.toString();
});
const status = document.querySelector('#status');
const pool = new SimplePool({ enableReconnect: true });
async function showCopyStatus() {
  const label = document.querySelector('#copy-status');
  try {
    const response = await fetch('/sync-status', { cache: 'no-store' });
    if (!response.ok) throw Error('Status unavailable');
    const state = await response.json();
    if (state.status === 'window-limit') {
      label.textContent = 'Automatic copying paused: this lab has reached its post limit.';
    } else if (state.status === 'retrying') {
      label.textContent = 'Catch-up waiting for both nodes. Copies will be retried.';
    } else if (state.status === 'synced' && state.lastSuccess && Date.now() - Date.parse(state.lastSuccess) < 90000) {
      label.textContent = `Stored copies checked at ${new Date(state.lastSuccess).toLocaleTimeString()}. New posts are checked periodically.`;
    } else {
      label.textContent = 'Stored-copy status is unavailable or out of date.';
    }
  } catch {
    label.textContent = 'Stored-copy status is unavailable.';
  }
}
showCopyStatus();
setInterval(showCopyStatus, 30000);
let key;
try {
  const saved = sessionStorage.getItem('kibera-nostr-lab-key');
  key = saved ? Uint8Array.from(JSON.parse(saved)) : generateSecretKey();
  sessionStorage.setItem('kibera-nostr-lab-key', JSON.stringify(Array.from(key)));
} catch {
  key = generateSecretKey();
}
document.querySelector('#identity').textContent = getPublicKey(key).slice(0, 16);
const events = new Map();
function render(event) {
  events.set(event.id, event);
  const feed = document.querySelector('#feed');
  feed.replaceChildren();
  [...events.values()].sort((a, b) => b.created_at - a.created_at).slice(0, 100).forEach(note => {
    const item = document.createElement('li');
    const header = document.createElement('small');
    header.textContent = `${note.pubkey.slice(0, 12)} · ${new Date(note.created_at * 1000).toLocaleString()}`;
    const content = document.createElement('p');
    content.textContent = note.content;
    item.append(header, content);
    feed.append(item);
  });
}
const connected = new Set();
const connectionStates = new Map(relays.map(url => [url, 'connecting']));
function showConnections() {
  document.querySelector('#relay-connections').textContent =
    `Primary: ${connectionStates.get(relays[0])} · HP: ${connectionStates.get(relays[1])}`;
}
pool.onRelayConnectionSuccess = url => {
  connected.add(url);
  connectionStates.set(url, 'connected');
  showConnections();
  status.textContent = `Connected to ${connected.size} of ${relays.length} local relays`;
};
pool.onRelayConnectionFailure = url => {
  connected.delete(url);
  connectionStates.set(url, 'unavailable');
  showConnections();
  status.textContent = connected.size ? `Connected to ${connected.size} of ${relays.length} local relays` : 'Local relays unavailable. Reconnecting…';
};
// Start both connections independently; either relay can supply the board.
try {
  pool.subscribe(relays, { kinds: [1], '#t': ['kibera-mesh-lab'], limit: 100 }, {
    onevent: render,
    onclose: () => { status.textContent = 'Connection closed. Reload to reconnect.'; },
  });
} catch (error) {
  status.textContent = `Relay unavailable: ${error.message}`;
}
document.querySelector('#compose').addEventListener('submit', async event => {
  event.preventDefault();
  const input = document.querySelector('#message');
  const content = input.value.trim();
  if (!content || content.length > 2000) return;
  const button = document.querySelector('#publish');
  button.disabled = true;
  try {
    const signed = finalizeEvent({ kind: 1, created_at: Math.floor(Date.now() / 1000),
      tags: [['t', 'kibera-mesh-lab']], content }, key);
    const results = await Promise.allSettled(pool.publish(relays, signed, { maxWait: 5000 }));
    const accepted = results.filter(result => result.status === 'fulfilled').length;
    if (!accepted) throw new Error('Neither local relay accepted the post');
    render(signed);
    input.value = '';
    status.textContent = `Post accepted by ${accepted} of ${relays.length} local relays`;
  } catch (error) {
    status.textContent = `Post was not accepted: ${error.message}`;
  } finally { button.disabled = false; }
});
