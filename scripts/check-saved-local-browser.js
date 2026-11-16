import { catalogPlanToSave } from '../src/utils/savedPlans.js';
import { toPlanCards } from '../src/services/baData.js';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, mkdtemp, writeFile, readFile } from 'node:fs/promises';
import { createServer, preview } from 'vite';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Real Chromium/CDP check, no account login or writes to Firebase.
const folder = new URL('../.browser-check/', import.meta.url);
await mkdir(folder, { recursive: true });
const reviewedPlans = toPlanCards(JSON.parse(await readFile(new URL('../public/data/ba-data.json', import.meta.url), 'utf8')));
const baData = globalThis.process.argv.includes('--ba-data');
const baDataHome = globalThis.process.argv.includes('--ba-data-home');
const production = globalThis.process.argv.includes('--production') || baData;
const server = production
  ? await preview({ preview: { host: '127.0.0.1', port: 0 } })
  : await createServer({ define: { 'import.meta.env.VITE_USE_FIREBASE': '"false"' }, server: { host: '127.0.0.1', port: 0, hmr: false, ws: false, watch: { ignored: ['**/.browser-check/**'] } } });
if (!production) await server.listen();
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


  const personalPhoto='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><rect width="20" height="20" fill="blue"/></svg>');
  const place=reviewedPlans.find(p=>p.id==='badata-food-1362');
  const current={...catalogPlanToSave(place),image:personalPhoto,favorite:true,status:'realizado',comment:'Recuerdo actual',rating:4};
  const legacy={id:'cat_1',catalogId:'cat_1',title:'Plan precargado antiguo',image:personalPhoto,comment:'Recuerdo antiguo',status:'realizado',favorite:true,scheduledAt:new Date().toISOString()};
  const legacyCoverage={id:'old-coverage',externalId:'coverage_1_1_1',title:'Cobertura antigua',status:'pendiente'};
  const custom={id:'6bd8c5bb-26d8-419a-9ce4-67b22fbde01a',title:'Merienda en el Café Tortoni',description:'Mi evento privado',image:personalPhoto,location:'Mi casa',category:'Gastronomía',status:'pendiente'};
  const itinerary={id:'protected-itinerary',type:'itinerary',title:'Itinerario anterior protegido',items:[legacy],image:personalPhoto,status:'pendiente'};
  const duplicate={...current,id:'historical-duplicate',comment:'Documento duplicado protegido'};
  const seed=[legacy,legacyCoverage,current,custom,itinerary,duplicate];
  const seedScript='if(!localStorage.getItem("saved-filter-test-seeded")){localStorage.setItem("porhacer_user_plans",'+JSON.stringify(JSON.stringify(seed))+');localStorage.setItem("porhacer_distinct_plan_photos_v2",JSON.stringify({"badata-food-1362":{image:"/images/plan-placeholder.svg"}}));localStorage.setItem("saved-filter-test-seeded","true");}';
  await call('Page.addScriptToEvaluateOnNewDocument',{source:seedScript});
  await call('Network.setBlockedURLs',{urls:['https://*']});
  await call('Emulation.setDeviceMetricsOverride',{width:1366,height:900,deviceScaleFactor:1,mobile:false});
  await call('Page.navigate',{url:origin});
  await until("!!document.querySelector('.credits-footer')");
  const click=async text=>{await evaluate("[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==="+JSON.stringify(text)+").click()");};
  await click('Mis planes');
  await until("document.querySelectorAll('.plan-card').length===2 && document.body.textContent.includes('2 planes del catálogo anterior')");
  assert.ok(await evaluate("!document.querySelector('#saved-plan-cat_1')&&!document.querySelector('#saved-plan-old-coverage')&&!document.querySelector('#saved-plan-historical-duplicate')"));
  assert.equal(await evaluate("document.querySelector('#saved-plan-badata-food-1362 img').getAttribute('src')"),place.image);
  assert.equal(await evaluate("document.querySelector('#saved-plan-"+custom.id+" img').getAttribute('src')"),personalPhoto);
  assert.deepEqual(await evaluate("JSON.parse(localStorage.getItem('porhacer_preview_plans'))"),seed,'Projection must never overwrite raw snapshots');
  assert.deepEqual(await evaluate("JSON.parse(JSON.parse(localStorage.getItem('porhacer_saved_plans_backup_v1')).legacy)"),seed);
  await click('Favoritos');await until("document.querySelectorAll('.plan-card').length===1");
  await click('Pendientes');await until("document.querySelectorAll('.plan-card').length===1");
  assert.ok(await evaluate("document.querySelector('.plan-card').textContent.includes('Mi evento privado')"));
  await click('Todos');
  await evaluate("document.querySelectorAll('.personal-section-switch button')[1].click()");
  await until("document.querySelectorAll('.plan-card').length===1");
  assert.ok(await evaluate("document.querySelector('.plan-card').textContent.includes('Itinerario anterior protegido')"));
  await click('Calendario');await until("document.querySelectorAll('.calendar-event-card').length===1");
  assert.ok(await evaluate("document.querySelector('.calendar-event-card').textContent.includes('Plan precargado antiguo')"));
  await click('Recuerdos');await until("document.querySelectorAll('.photo-card').length===3");
  assert.ok(await evaluate("[...document.querySelectorAll('.photo-card img')].every(i=>i.getAttribute('src').startsWith('data:image/'))"));
  await call('Page.reload',{ignoreCache:true});await until("!!document.querySelector('.credits-footer')");
  await click('Mis planes');await until("document.querySelectorAll('.plan-card').length===2");
  assert.deepEqual(await evaluate("JSON.parse(localStorage.getItem('porhacer_preview_plans'))"),seed);
  assert.deepEqual(await evaluate("JSON.parse(localStorage.getItem('porhacer_user_plans'))"),seed);
  assert.deepEqual(exceptions,[]);
  const result={localPreview:true,legacyHiddenInFixture:2,duplicateGroupedInFixture:1,rawRecordsRetained:seed.length,localBackup:'passed',matchingCustomTitlePreserved:true,photoRefresh:'passed',personalMemoryPhotos:'passed',legacyCalendarAndMemoriesPreserved:true,itineraryPreserved:true,reload:'passed',javascriptExceptions:exceptions};
  await writeFile(new URL('saved-local-browser-result.json',folder),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}finally{socket?.close();browser.kill();if(typeof server.close==='function')await server.close();else await new Promise(resolve=>server.httpServer.close(resolve));}
