import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { createServer } from 'vite';
import { Buffer } from 'node:buffer';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Real Chromium/CDP check, no account login or writes to Firebase.
const folder = new URL('../.browser-check/', import.meta.url);
await mkdir(folder, { recursive: true });
const server = await createServer({ define: { 'import.meta.env.VITE_USE_FIREBASE': '"false"' }, server: { host: '127.0.0.1', port: 0, hmr: false, ws: false, watch: { ignored: ['**/.browser-check/**'] } } });
await server.listen();
const origin = `http://127.0.0.1:${server.httpServer.address().port}`;
const executable = globalThis.process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const profile = await mkdtemp(join(tmpdir(), 'porhacer-browser-'));
const browser = spawn(executable, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { windowsHide: true });
let socket;
try {
  const address = await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Chrome startup timed out')), 15_000);
    browser.once('error', (error) => { clearTimeout(timeout); reject(error); });
    browser.stderr.on('data', (data) => {
      const match = /DevTools listening on (ws:\/\/\S+)/.exec(String(data));
      if (match) { clearTimeout(timeout); resolve(match[1]); }
    });
  });
  const targets = await (await fetch(`http://${new URL(address).host}/json/list`)).json();
  socket = new WebSocket(targets.find((target) => target.type === 'page').webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  let sequence = 0;
  const pending = new Map();
  socket.onmessage = ({ data }) => {
    const message = JSON.parse(data);
    if (message.id && pending.has(message.id)) {
      const { resolve, reject, timer } = pending.get(message.id);
      clearTimeout(timer);
      pending.delete(message.id);
      if (message.error) reject(new Error(message.error.message)); else resolve(message.result);
    }
  };
  const command = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
    const id = ++sequence;
    const timer = setTimeout(() => { pending.delete(id); reject(new Error(`${method} timed out`)); }, 15_000);
    pending.set(id, { resolve, reject, timer });
    socket.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
  });
  const call = (method, params) => command(method, params);
  const evaluate = async (expression) => {
    const { result, exceptionDetails } = await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (exceptionDetails) throw new Error(JSON.stringify(exceptionDetails));
    return result.value;
  };
  const until = async (expression) => {
    const deadline = Date.now() + 12_000;
    while (Date.now() < deadline) {
      if (await evaluate(expression)) return;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    throw new Error(`Condition not met: ${expression}`);
  };
  await call('Page.enable');
  await call('Network.enable');
  await call('Network.setBlockedURLs', { urls: ['https://*'] });
  await call('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await call('Page.navigate', { url: origin });
  await until('!!document.querySelector("input[type=search]")');
  await evaluate(`(() => { const input=document.querySelector('input[type=search]'); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'Cárcova'); input.dispatchEvent(new Event('input',{bubbles:true})); })()`);
  await until(`document.querySelectorAll('.plan-card').length===1 && document.body.textContent.includes('Museo de la Cárcova')`);
  const mobile = await evaluate(`({viewport:innerWidth,width:document.documentElement.scrollWidth,cards:document.querySelectorAll('.plan-card').length,source:!!document.querySelector('a[href="https://www.openstreetmap.org/way/149957847"]'),columns:getComputedStyle(document.querySelector('.cards-grid')).gridTemplateColumns})`);
  assert.equal(mobile.source, true);
  assert.ok(mobile.width <= mobile.viewport, JSON.stringify(mobile));
  await evaluate(`document.querySelector('.plan-card').scrollIntoView()`);
  const screenshot = await call('Page.captureScreenshot', { format: 'png' });
  await writeFile(new URL('mobile.png', folder), Buffer.from(screenshot.data, 'base64'));
  await call('Network.setBlockedURLs', { urls: ['https://*', '*api/places*'] });
  await call('Page.reload', { ignoreCache: true });
  await until(`!!document.querySelector('input[type=search]') && document.body.textContent.includes('No hay eventos con fecha confirmada para hoy.')`);
  const api = await evaluate(`JSON.parse(localStorage.getItem('porhacer_openstreetmap_places_v4')).places.length`);
  assert.equal(api, 10);
  await call('Emulation.setDeviceMetricsOverride', { width: 1366, height: 900, deviceScaleFactor: 1, mobile: false });
  await until(`document.querySelectorAll('.plan-card').length===6`);
  const desktop = await evaluate(`({viewport:innerWidth,width:document.documentElement.scrollWidth,columns:getComputedStyle(document.querySelector('.cards-grid')).gridTemplateColumns.split(' ').length})`);
  assert.equal(desktop.columns, 3);
  assert.ok(desktop.width <= desktop.viewport);
  console.log(JSON.stringify({ mobile, desktop, offlineCachedPlaces: api, firebase: 'Not tested: preview mode; no credentials or remote writes', screenshot: '.browser-check/mobile.png' }, null, 2));
} finally {
  socket?.close();
  browser.kill();
  await server.close();
}
