import { discoveryOptions, neighborhoodFor, placeTypeFor } from '../src/utils/discoveryFilters.js';
import { toPlanCards } from '../src/services/baData.js';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, mkdtemp, writeFile, readFile } from 'node:fs/promises';
import { createServer, preview } from 'vite';
import { Buffer } from 'node:buffer';
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

  await call('Network.setBlockedURLs', {urls:['https://*']});
  await call('Emulation.setDeviceMetricsOverride',{width:1366,height:900,deviceScaleFactor:1,mobile:false});
  await call('Page.navigate',{url:origin});
  await until("document.querySelector('#discover-plans')?.textContent.includes('"+reviewedPlans.length+" planes')");
  await until("[...document.querySelectorAll('.plan-card img')].every(i=>i.complete&&i.naturalWidth>0)");
  const manifests=await Promise.all(['baDataPilot.json','baDataPhotos.json'].map(async f=>JSON.parse(await readFile(new URL('../src/data/'+f,import.meta.url),'utf8'))));
  const images=manifests.flatMap(m=>m.entries.filter(e=>e.photo).map(e=>e.photo.localPath));
  assert.ok(await evaluate('Promise.all('+JSON.stringify(images)+'.map(src=>new Promise(resolve=>{const image=new Image();image.onload=()=>resolve(image.naturalWidth>0);image.onerror=()=>resolve(false);image.src=src;}))).then(results=>results.every(Boolean))'));
  assert.equal(await evaluate("getComputedStyle(document.querySelector('.cards-grid')).gridTemplateColumns.split(' ').length"),3);
  assert.ok(await evaluate("[...document.querySelectorAll('.plan-card img')].every(i=>i.getAttribute('src').startsWith('/images/ba-data-'))"));
  await evaluate("[...document.querySelectorAll('button')].find(b=>b.textContent==='Ver m\u00e1s').click()");
  await until("document.querySelectorAll('.plan-card').length===12");
  // Exercise every neighborhood and every published type against the real catalog.
  const selectFilter = async (label, value) => {
    await evaluate(`(()=>{const select=document.querySelector('select[aria-label=${JSON.stringify(label)}]');if(!select)throw Error('Missing select');select.value=${JSON.stringify(value)};select.dispatchEvent(new Event('change',{bubbles:true}));})()`);
  };
  const chooseCategory = async label => {
    await evaluate(`[...document.querySelectorAll('.category-filter button')].find(button=>button.textContent===${JSON.stringify(label)}).click()`);
  };
  const searchFor = async value => {
    await evaluate(`(()=>{const input=document.querySelector('input[type=search]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,${JSON.stringify(value)});input.dispatchEvent(new Event('input',{bubbles:true}));})()`);
  };
  const checkResults = async expected => {
    await until(`document.querySelector('#discover-plans').textContent.includes('${expected.length} planes') && document.querySelectorAll('.discovery-section .plan-card').length===${Math.min(expected.length,6)}`);
    const titles = await evaluate("[...document.querySelectorAll('.discovery-section .card-title')].map(element=>element.textContent)");
    assert.ok(titles.every(title=>expected.some(plan=>plan.title===title)));
    assert.equal(await evaluate("document.querySelector('.discovery-section .photo-credit[role=status]').textContent"), expected.length+' resultados');
  };
  const allTitles = async () => {
    while(await evaluate("!!document.querySelector('.discovery-show-more button')")){
      await evaluate("document.querySelector('.discovery-show-more button').click()");
      await new Promise(resolve=>setTimeout(resolve,30));
    }
    return evaluate("[...document.querySelectorAll('.discovery-section .card-title')].map(element=>element.textContent)");
  };
  const recommendedFirstPage = await evaluate("[...document.querySelectorAll('.discovery-section .card-title')].slice(0,6).map(element=>element.textContent)");
  const options = discoveryOptions(reviewedPlans);
  assert.deepEqual(await evaluate("[...document.querySelector('select[aria-label=\"Filtrar por zona\"]').options].slice(1).map(option=>option.textContent)"),options.zones.map(option=>option.name));
  assert.deepEqual(await evaluate("[...document.querySelector('select[aria-label=\"Filtrar por tipo de lugar\"]').options].slice(1).map(option=>option.textContent)"),options.placeTypes.map(option=>option.name));
  for(const zone of options.zones){
    await selectFilter('Filtrar por zona',zone.name);
    await checkResults(reviewedPlans.filter(plan=>neighborhoodFor(plan)===zone.name));
  }
  await selectFilter('Filtrar por zona','Todas');
  for(const type of options.placeTypes){
    await selectFilter('Filtrar por tipo de lugar',type.name);
    await checkResults(reviewedPlans.filter(plan=>placeTypeFor(plan)===type.name));
  }
  await selectFilter('Filtrar por tipo de lugar','Todos');
  await selectFilter('Ordenar por','alpha');
  await checkResults(reviewedPlans);
  const ascending = [...reviewedPlans].sort((a,b)=>a.title.localeCompare(b.title,'es')).map(plan=>plan.title);
  assert.deepEqual(await allTitles(),ascending,'Sort all 53 plans before pagination');
  await selectFilter('Ordenar por','alpha-desc');
  await checkResults(reviewedPlans);
  assert.deepEqual(await allTitles(),ascending.toReversed());
  await selectFilter('Ordenar por','recommended');
  await checkResults(reviewedPlans);
  assert.deepEqual(await evaluate("[...document.querySelectorAll('.discovery-section .card-title')].map(element=>element.textContent)"),recommendedFirstPage);
  await selectFilter('Filtrar por zona','San Telmo');
  await selectFilter('Filtrar por tipo de lugar','Museos');
  await selectFilter('Ordenar por','alpha-desc');
  await chooseCategory('Cultura');
  await searchFor('historico');
  await checkResults(reviewedPlans.filter(plan=>plan.id==='badata-culture-2674'));
  await searchFor('');
  await selectFilter('Filtrar por zona','Palermo');
  await selectFilter('Filtrar por tipo de lugar','Cementerios');
  await checkResults([]);
  assert.ok(await evaluate("document.querySelector('.empty-state').textContent.includes('No encontramos planes con esos filtros')"));
  await evaluate("[...document.querySelectorAll('button')].find(button=>button.textContent==='Limpiar filtros').click()");
  await checkResults(reviewedPlans);
  // Returning to a former filter combination must not restore its expanded page.
  await evaluate("document.querySelector('.discovery-show-more button').click()");
  await until("document.querySelectorAll('.discovery-section .plan-card').length===12");
  await selectFilter('Filtrar por tipo de lugar','Parques y plazas');
  await checkResults(reviewedPlans.filter(plan=>placeTypeFor(plan)==='Parques y plazas'));
  await selectFilter('Filtrar por tipo de lugar','Todos');
  await checkResults(reviewedPlans);
  console.log(JSON.stringify({neighborhoodOptions:options.zones.length,typeOptions:options.placeTypes.length,individualFilters:'passed',combinedFilters:'passed',globalSortBothDirections:'passed',paginationReset:'passed',emptyResults:'passed'}));

  for(const [category,total] of Object.entries(reviewedPlans.reduce((counts,p)=>(counts[p.category]=(counts[p.category]||0)+1,counts),{}))){
   await evaluate("[...document.querySelectorAll('.category-filter button')].find(b=>b.textContent==="+JSON.stringify(category === 'Viajes' ? 'Íconos de BA' : category)+").click()");
   await until("document.body.textContent.includes('"+total+" resultados')");
  }
  assert.deepEqual(await evaluate("[...document.querySelectorAll('.category-filter button')].map(b=>b.textContent)"),['Todas','Gastronomía','Cultura','Aire Libre','Íconos de BA']);
  await evaluate("[...document.querySelectorAll('.category-filter button')].find(b=>b.textContent==='Íconos de BA').click()");
  await evaluate("[...document.querySelectorAll('.plan-card button')].find(b=>b.textContent.includes('Agregar a mis planes')).click()");
  assert.ok(await evaluate("JSON.parse(localStorage.getItem('porhacer_preview_plans')).some(p=>p.catalogId.startsWith('tourism-wikidata-')&&p.photograph.evidence&&p.sourceLicense==='CC0')"));
  await evaluate("[...document.querySelectorAll('.plan-card button')].find(b=>b.textContent==='Ver detalles').click()");
  await until("!!document.querySelector('.modal-content')");
  assert.ok(await evaluate("document.querySelector('.modal-content').textContent.includes('Wikidata') && document.querySelector('.modal-content').textContent.includes('CC0')"));
  await evaluate("document.querySelector('.modal-close').click()");
  await evaluate("[...document.querySelectorAll('.category-filter button')].find(b=>b.textContent==='Todas').click()");
  await evaluate("(()=>{const input=document.querySelector('input[type=search]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'Tortoni');input.dispatchEvent(new Event('input',{bubbles:true}));})()");
  await until("document.querySelectorAll('.plan-card').length===1");
  await until("document.querySelector('.plan-card img').complete && document.querySelector('.plan-card img').naturalWidth>0");
  await evaluate("[...document.querySelectorAll('.plan-card button')].find(b=>b.textContent.includes('Agregar a mis planes')).click()");
  assert.ok(await evaluate("JSON.parse(localStorage.getItem('porhacer_preview_plans')).some(p=>p.catalogId==='badata-food-1362'&&p.photograph.evidence)"));
  const tick = () => new Promise(resolve=>setTimeout(resolve,80));
  const click = async text => { await evaluate("(()=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==="+JSON.stringify(text)+");if(!b)throw Error('Button missing: '+"+JSON.stringify(text)+");b.click();})()"); await tick(); };
  const fill = async (selector,value,index=0) => { await evaluate("(()=>{const input=document.querySelectorAll("+JSON.stringify(selector)+")["+index+"];Object.getOwnPropertyDescriptor(Object.getPrototypeOf(input),'value').set.call(input,"+JSON.stringify(value)+");input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));})()"); await tick(); };
  await click('Mis planes');
  await until("!!document.querySelector('.fav-btn')");
  await evaluate("document.querySelector('.fav-btn').click()");
  await until("document.querySelector('.fav-btn').classList.contains('is-favorite')");
  await click('Agregar a calendario');
  await until("!!document.querySelector('.schedule-modal form')");
  await evaluate("document.querySelector('.schedule-modal form').requestSubmit()");
  await until("!!document.querySelector('.calendar-event-card')");
  await click('Mis planes');
  await click('Realizado');
  await click('Recuerdos');
  await until("!!document.querySelector('.photo-card')");
  await click('+ Crear plan');
  await fill('.modal-content input[maxlength="100"]','Plan personalizado de prueba');
  await fill('.modal-content input[maxlength="100"]','Buenos Aires',1);
  await fill('.modal-content textarea','Prueba local en perfil aislado.');
  await evaluate("document.querySelector('.modal-content form').requestSubmit()");
  await until("!document.querySelector('.modal-content')");
  assert.ok(await evaluate("JSON.parse(localStorage.getItem('porhacer_preview_plans')).some(p=>p.title==='Plan personalizado de prueba')"));
  await click('Inicio');
  await click('Sugerir itinerario');
  await until("document.querySelectorAll('.itinerary-list li').length===2");
  await click('Guardar itinerario');
  await until("JSON.parse(localStorage.getItem('porhacer_preview_plans')).some(p=>p.type==='itinerary')");
  await fill('input[type=search]','');
  await evaluate("document.querySelector('#discover-plans').scrollIntoView()");
  const shot=await call('Page.captureScreenshot',{format:'png'});await writeFile(new URL('verified-desktop.png',folder),Buffer.from(shot.data,'base64'));
  await call('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
  assert.ok(await evaluate('document.documentElement.scrollWidth<=innerWidth'));
  const mobile=await call('Page.captureScreenshot',{format:'png'});await writeFile(new URL('verified-mobile.png',folder),Buffer.from(mobile.data,'base64'));
  await call('Network.setBlockedURLs',{urls:['https://*','*/data/ba-data.json']});
  await call('Page.reload',{ignoreCache:true});
  await until("document.body.textContent.includes('No se pudo cargar el cat\u00e1logo fotogr\u00e1fico')");
  assert.equal(await evaluate("document.querySelectorAll('.discovery-section .plan-card').length"),0);
  assert.ok(await evaluate("JSON.parse(localStorage.getItem('porhacer_preview_plans')).some(p=>p.catalogId==='badata-food-1362')"));
  assert.deepEqual(exceptions,[]);
  console.log(JSON.stringify({plans:reviewedPlans.length,images:'all decoded',favorites:'passed',calendar:'passed',memories:'passed',customPlans:'passed',itineraries:'passed',filters:'passed',pagination:'passed',save:'passed',savedSurvivesCatalogFailure:true,errorWithoutFallback:true,desktopColumns:3,mobileOverflow:false,javascriptExceptions:exceptions}));
} finally { socket?.close();browser.kill();if(typeof server.close==='function')await server.close();else await new Promise(resolve=>server.httpServer.close(resolve)); }
