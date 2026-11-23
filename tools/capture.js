// Capture real gameplay frames from Star Dodge via CDP screencast.
// Node 22 stdlib only. Usage: node capture.js <url> <outdir> <seconds>
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';

const CHROME = process.env.HOME + '/.cache/ms-playwright/chromium_headless_shell-1255/chrome-headless-shell-linux64/chrome-headless-shell';
const [url, outdir, secsArg] = process.argv.slice(2);
const SECONDS = Number(secsArg || 24);
mkdirSync(outdir, { recursive: true });

const chrome = spawn(CHROME, [
  '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage',
  '--remote-debugging-port=9222', '--window-size=1280,720',
  '--user-data-dir=/tmp/chrome-cdp-profile', '--hide-scrollbars', 'about:blank',
], { stdio: 'ignore' });

async function waitForDebugger() {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch('http://127.0.0.1:9222/json/version');
      if (r.ok) return await r.json();
    } catch (e) { /* not up yet */ }
    await sleep(500);
  }
  throw new Error('devtools never came up');
}

const ver = await waitForDebugger();
const create = await fetch('http://127.0.0.1:9222/json/new?about:blank', { method: 'PUT' });
const target = await create.json();
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });

let id = 0;
const pending = new Map();
const frames = [];
let frameCount = 0;
let stateLog = [];
function send(method, params = {}) {
  return new Promise((resolve) => {
    const mid = ++id;
    pending.set(mid, resolve);
    ws.send(JSON.stringify({ id: mid, method, params }));
  });
}
ws.onmessage = async (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg.result); pending.delete(msg.id); return; }
  if (msg.method === 'Page.screencastFrame') {
    const p = msg.params;
    frameCount++;
    writeFileSync(`${outdir}/f${String(frameCount).padStart(4, '0')}.jpg`, Buffer.from(p.data, 'base64'));
    frames.push({ n: frameCount, ts: p.metadata.timestamp });
    await send('Page.screencastFrameAck', { sessionId: p.sessionId });
  }
};

await send('Page.enable');
await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url });
await sleep(1500);
await send('Page.startScreencast', { format: 'jpeg', quality: 82, maxWidth: 1280, maxHeight: 720, everyNthFrame: 1 });

const t0 = Date.now();
while (Date.now() - t0 < SECONDS * 1000) {
  await sleep(2000);
  try {
    const r = await send('Runtime.evaluate', { expression: 'JSON.stringify({state, score, lives, level})', returnByValue: true });
    stateLog.push(r?.result?.value);
  } catch (e) { /* ignore */ }
}
await send('Page.stopScreencast');
console.log('frames:', frameCount, 'state samples:', JSON.stringify(stateLog));
ws.close();
chrome.kill();
process.exit(0);
