import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, mkdtemp, writeFile, readFile } from 'node:fs/promises';
import { build, createServer, preview } from 'vite';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Real Chromium/CDP check, no account login or writes to Firebase.
const folder = new URL('../.browser-check/', import.meta.url);
await mkdir(folder, { recursive: true });
const baData = globalThis.process.argv.includes('--ba-data');
const baDataHome = globalThis.process.argv.includes('--ba-data-home');
const production = globalThis.process.argv.includes('--production') || baData;
// Compile an isolated preview without account credentials or production writes.
const isolatedBuild = globalThis.process.argv.includes('--isolated-build');
const testOutDir = '.browser-check/verified-build';
if (isolatedBuild) await build({ define: { 'import.meta.env.VITE_USE_FIREBASE': '"false"' }, build: { outDir: testOutDir } });
const server = production || isolatedBuild
  ? await preview({ ...(isolatedBuild ? { build: { outDir: testOutDir } } : {}), preview: { host: '127.0.0.1', port: 0 } })
  : await createServer({ plugins: globalThis.process.argv.includes('--historical') ? [{name:'historical-desktop',enforce:'pre',load(id){const file=id.replaceAll('\\','/').split('/src/')[1];if(['AppFirebase.jsx','App.css'].includes(file))return execFileSync('git',['show','0617920:src/'+file],{encoding:'utf8'});}}] : [], define: { 'import.meta.env.VITE_USE_FIREBASE': '"false"' }, server: { host: '127.0.0.1', port: 0, hmr: false, ws: false, watch: { ignored: ['**/.browser-check/**'] } } });
if (!production && !isolatedBuild) await server.listen();
const origin = `http://127.0.0.1:${server.httpServer.address().port}`;
if (production || baDataHome) {
  const response = await fetch(`${origin}/data/ba-data.json`);
  assert.equal(response.status, 200);
  assert.equal((await response.json()).places.length, 6670);
}
const executable = globalThis.process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const profile = await mkdtemp(join(tmpdir(), 'porhacer-browser-'));
const browser = spawn(executable, ['--headless=new', '--disable-gpu', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { windowsHide: true });
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
  const exceptions = [];
  socket.onmessage = ({ data }) => {
    const message = JSON.parse(data);
    if (message.method === 'Runtime.exceptionThrown') exceptions.push(message.params.exceptionDetails.text);
    if (message.method === 'Runtime.exceptionThrown') console.error(JSON.stringify(message.params.exceptionDetails));
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
      try {
        if (await evaluate(expression)) return;
      } catch (error) {
        if (!/navigated|Execution context was destroyed|Cannot find context/i.test(error.message)) throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    throw new Error(`Condition not met: ${expression}`);
  };
  await call('Page.enable');
  await call('Page.bringToFront');
  await call('Runtime.enable');
  await call('Network.enable');

  await call('Network.setBlockedURLs',{urls:['https://*']});
  await call('Page.addScriptToEvaluateOnNewDocument',{source:"document.addEventListener('DOMContentLoaded',()=>{const s=document.createElement('style');s.textContent='*,*::before,*::after{transition:none!important;animation:none!important}';document.head.append(s);});"});
  await call('Page.navigate',{url:origin});
  await until("document.querySelector('.discovery-section .photo-credit[role=status]')?.textContent==='84 resultados'");
  const click=async label=>evaluate("[...document.querySelectorAll('.nav-btn')].find(b=>b.textContent.trim()==="+JSON.stringify(label)+").click()");
  const signature=()=>evaluate("[...document.querySelectorAll('.navbar,.nav-brand,.nav-btn,.main-content,.main-welcome-hero,.welcome-text h2,.discovery-section,.section-header h2,.plan-card,.calendar-layout,.calendar-grid,.calendar-day')].map(el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);return {tag:el.tagName,class:el.className,x:r.x,y:r.y,width:r.width,height:r.height,color:s.color,background:s.backgroundColor,font:s.fontFamily,fontSize:s.fontSize,columns:s.gridTemplateColumns};})");
  const result={};
  for(const width of [1366,1440]){
    await call('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});
    for(const label of ['Inicio','Mis planes','Calendario','Recuerdos']){
      await click(label);await new Promise(r=>setTimeout(r,80));
      result[width+'-'+label]=await signature();
    }
  }
  const path=new URL('responsive-desktop-baseline.json',folder);
  if(globalThis.process.argv.includes('--compare')){
    const before=JSON.parse(await readFile(path,'utf8'));assert.deepEqual(result,before);console.log('Desktop layout, colors and fonts unchanged at 1366 and 1440 px');
  }else{await writeFile(path,JSON.stringify(result,null,2));console.log('Desktop baseline saved');}
  assert.deepEqual(exceptions,[]);
}finally{socket?.close();browser.kill();if(typeof server.close==='function')await server.close();else await new Promise(resolve=>server.httpServer.close(resolve));}
