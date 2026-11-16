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
const baData = globalThis.process.argv.includes('--ba-data');
const production = globalThis.process.argv.includes('--production') || baData;
const server = production
  ? await preview({ preview: { host: '127.0.0.1', port: 0 } })
  : await createServer({ define: { 'import.meta.env.VITE_USE_FIREBASE': '"false"' }, server: { host: '127.0.0.1', port: 0, hmr: false, ws: false, watch: { ignored: ['**/.browser-check/**'] } } });
if (!production) await server.listen();
const origin = `http://127.0.0.1:${server.httpServer.address().port}`;
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
  await call('Network.setBlockedURLs', { urls: ['https://*'] });
  await call('Emulation.setDeviceMetricsOverride', { width: 1366, height: 900, deviceScaleFactor: 1, mobile: false });
  await call('Page.navigate', { url: baData ? `${origin}/ba-data-preview.html` : origin });
  if (baData) {
    const cache = JSON.parse(await readFile(new URL('../public/data/ba-data.json', import.meta.url), 'utf8'));
    await until(`document.querySelectorAll('.plan-card').length>0`);
    assert.ok(await evaluate(`document.body.textContent.includes('${cache.places.length.toLocaleString('es-AR')} registros oficiales')`));
    for (const item of cache.statistics) {
      await evaluate(`[...document.querySelectorAll('.category-filter button')].find(button=>button.textContent===${JSON.stringify(item.category)}).click()`);
      await until(`[...document.querySelectorAll('.plan-card .badge')].every(badge=>badge.textContent===${JSON.stringify(item.category)})`);
      assert.ok(await evaluate(`document.querySelector('p[role=status]').textContent.includes('${item.unique.toLocaleString('es-AR')} resultados')`));
      await evaluate(`document.querySelector('.plan-card .btn-secondary').click()`);
      await until(`!!document.querySelector('[role=dialog]')`);
      assert.ok(await evaluate(`document.querySelector('[role=dialog]').textContent.includes('Registro ')`));
      await evaluate(`document.querySelector('.modal-close').click()`);
    }
    await evaluate(`[...document.querySelectorAll('.category-filter button')].find(button=>button.textContent==='Todas').click()`);
    await evaluate(`(()=>{const input=document.querySelector('input[type=search]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'GUANTANAMERA');input.dispatchEvent(new Event('input',{bubbles:true}));})()`);
    await until(`document.querySelectorAll('.plan-card').length===1 && document.querySelector('.plan-card').textContent.includes('GUANTANAMERA')`);
    await evaluate(`(()=>{const select=document.querySelector('select[aria-label="Filtrar por presupuesto"]');select.value='Bajo';select.dispatchEvent(new Event('change',{bubbles:true}));})()`);
    await until(`!!document.querySelector('.empty-state')`);
    await evaluate(`(()=>{const select=document.querySelector('select[aria-label="Filtrar por presupuesto"]');select.value='Todos';select.dispatchEvent(new Event('change',{bubbles:true}));})()`);
    await until(`document.querySelectorAll('.plan-card').length===1`);
    await call('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    assert.ok(await evaluate(`document.documentElement.scrollWidth<=innerWidth`));
    await evaluate(`document.querySelector('.plan-card').scrollIntoView()`);
    const screenshot = await call('Page.captureScreenshot', { format: 'png' });
    await writeFile(new URL('ba-data-preview-mobile.png', folder), Buffer.from(screenshot.data, 'base64'));
    assert.deepEqual(exceptions, []);
    console.log(JSON.stringify({ baDataPreview: 'passed', realRecords: cache.places.length, categoryFilters: 'passed', searchAndBudget: 'passed', sourceDetails: 'passed', externalHttpsBlocked: true, firebaseTouched: false, javascriptExceptions: exceptions }));
  } else if (production) {
    await until(`!!document.querySelector('.auth-card input[type=email], #discover-plans')`);
    assert.ok(await evaluate(`document.body.textContent.includes('Por Hacer')`));
    const loginVisible = await evaluate(`!!document.querySelector('.auth-card input[type=email]')`);
    if (loginVisible) {
      assert.equal(await evaluate(`document.querySelectorAll('.auth-card input[type=password]').length`), 1);
      assert.equal(await evaluate(`document.querySelector('.auth-card input[type=password]').autocomplete`), 'current-password');
      await evaluate(`document.querySelectorAll('.auth-mode-switch button')[1].click()`);
      await until(`document.querySelectorAll('.auth-card input[type=password]').length===2`);
      assert.equal(await evaluate(`document.querySelector('#auth-title').textContent`), 'Creá tu cuenta');
      assert.ok(await evaluate(`[...document.querySelectorAll('.auth-card input[type=password]')].every(input=>input.autocomplete==='new-password')`));
      await evaluate(`(()=>{const inputs=[...document.querySelectorAll('.auth-card input')];const values=['prueba@example.com','clave-prueba-1','clave-prueba-2'];inputs.forEach((input,index)=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,values[index]);input.dispatchEvent(new Event('input',{bubbles:true}));});})()`);
      await new Promise((resolve) => setTimeout(resolve, 50));
      await evaluate(`document.querySelector('.auth-card form').requestSubmit()`);
      await until(`document.querySelector('[role=alert]')?.textContent.includes('Las contraseñas no coinciden')`);
      await evaluate(`document.querySelectorAll('.auth-mode-switch button')[0].click()`);
      await until(`document.querySelectorAll('.auth-card input[type=password]').length===1 && !document.querySelector('[role=alert]')`);
      assert.equal(await evaluate(`document.querySelector('.auth-card input[type=password]').value`), '');
      await call('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
      assert.ok(await evaluate(`document.documentElement.scrollWidth<=innerWidth`));
    }
    assert.deepEqual(exceptions, []);
    console.log(JSON.stringify({ productionBuild: 'passed', firebaseLoginScreen: loginVisible, loginRegisterSwitch: loginVisible ? 'passed' : 'not applicable', passwordConfirmation: loginVisible ? 'passed locally, no account created' : 'not applicable', javascriptExceptions: exceptions, remoteLoginTested: false }));
  } else {
    await until('!!document.querySelector("input[type=search]")');
    console.log('Checking original catalog and details...');
    const tick = () => new Promise((resolve) => setTimeout(resolve, 50));
    const click = async (text) => {
      await evaluate(`(() => { const button=[...document.querySelectorAll('button')].find(item=>item.textContent.trim()===${JSON.stringify(text)}); if(!button)throw Error('Missing button');button.click(); })()`);
      await tick();
    };
    const fill = async (selector, value, index = 0) => {
      await evaluate(`(() => { const input=document.querySelectorAll(${JSON.stringify(selector)})[${index}];input.focus();Object.getOwnPropertyDescriptor(Object.getPrototypeOf(input),'value').set.call(input,${JSON.stringify(value)});input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true})); })()`);
      await tick();
    };
    assert.ok(await evaluate(`document.querySelector('#discover-plans').textContent.includes('129 ideas')`));
    assert.ok(await evaluate(`!document.body.textContent.includes('Planes para hacer hoy')`));
    assert.ok(await evaluate(`![...document.querySelectorAll('.category-filter button')].some(button=>['Entretenimiento','Experiencias'].includes(button.textContent))`));
    for (let page = 0; page < 22 && await evaluate(`!![...document.querySelectorAll('button')].find(button=>button.textContent==='Ver más')`); page += 1) await click('Ver más');
    assert.equal(await evaluate(`document.querySelectorAll('.plan-card').length`), 129);
    let details = 0;
    for (let offset = 0; offset < 129; offset += 6) {
      details += await evaluate(`(async()=>{const cards=[...document.querySelectorAll('.plan-card')].slice(${offset},${offset + 6});let count=0;for(const card of cards){const title=card.querySelector('h3').textContent;[...card.querySelectorAll('button')].find(button=>button.textContent==='Ver detalles').click();await new Promise(resolve=>setTimeout(resolve,0));if(document.querySelector('#plan-detail-title')?.textContent!==title)throw Error('Wrong detail: '+title);count++;document.querySelector('.modal-close').click();await new Promise(resolve=>setTimeout(resolve,0));}return count;})()`);
      if (details % 24 === 0) console.log(`Details checked: ${details}/129`);
    }
    assert.equal(details, 129);
    console.log('All 129 detail dialogs passed; checking local personal plans...');
    await fill('input[type=search]', 'Tortoni');
    await until(`document.querySelectorAll('.plan-card').length>0 && [...document.querySelectorAll('.plan-card')].every(card=>card.textContent.includes('Tortoni'))`);
    assert.ok(await evaluate(`document.querySelector('.plan-card').textContent.includes('Tortoni')`));
    await fill('input[type=search]', '');
    await click('+ Crear plan');
    await fill('.modal-content input[maxlength="100"]', 'Prueba local de entrega', 0);
    await fill('.modal-content input[maxlength="100"]', 'Ubicación de prueba local', 1);
    await fill('.modal-content textarea', 'Plan temporal de prueba en un perfil aislado.');
    await evaluate(`document.querySelector('.modal-content form').requestSubmit()`);
    await until(`!document.querySelector('.modal-content') && document.querySelector('.plan-card')?.textContent.includes('Prueba local de entrega')`);
    await evaluate(`document.querySelector('.fav-btn').click()`);
    await until(`document.querySelector('.fav-btn').classList.contains('is-favorite')`);
    const personalBeforeEdit = await evaluate(`JSON.parse(localStorage.getItem('porhacer_preview_plans'))[0]`);
    await evaluate(`document.querySelector('.plan-edit-action').click()`);
    await tick();
    assert.equal(await evaluate(`document.querySelectorAll('.modal-content form input').length`), 1);
    assert.equal(await evaluate(`document.querySelectorAll('.modal-content form textarea,.modal-content form select').length`), 0);
    await fill('.modal-content input[maxlength="100"]', 'Prueba local editada', 0);
    await evaluate(`document.querySelector('.modal-content form').requestSubmit()`);
    await until(`!document.querySelector('.modal-content') && document.querySelector('.plan-card').textContent.includes('Prueba local editada')`);
    const personalAfterEdit = await evaluate(`JSON.parse(localStorage.getItem('porhacer_preview_plans'))[0]`);
    assert.deepEqual({ ...personalAfterEdit, title: personalBeforeEdit.title }, personalBeforeEdit);
    await click('Agregar a calendario');
    await until(`!!document.querySelector('.schedule-modal form')`);
    await evaluate(`document.querySelector('.schedule-modal form').requestSubmit()`);
    await until(`!!document.querySelector('.calendar-event-card')`);
    assert.ok(await evaluate(`document.querySelector('.calendar-event-card').textContent.includes('Prueba local editada')`));
    await click('Mis planes');
    await click('Realizado');
    await click('Recuerdos');
    await until(`!!document.querySelector('.photo-card')`);
    assert.ok(await evaluate(`document.querySelector('.photo-card').textContent.includes('Prueba local editada')`));
    await click('Mis planes');
    await evaluate(`window.confirm=()=>true`);
    await click('Eliminar');
    await until(`JSON.parse(localStorage.getItem('porhacer_preview_plans')).length===0`);
    await click('Inicio');
    console.log('Local CRUD, favorites, calendar and memories passed; checking itineraries and responsive layout...');
    await click('Sugerir itinerario');
    await until(`document.querySelectorAll('.itinerary-list li').length===2`);
    await click('Guardar itinerario');
    await until(`JSON.parse(localStorage.getItem('porhacer_preview_plans')).some(plan=>plan.type==='itinerary')`);
    const itineraryBeforeEdit = await evaluate(`JSON.parse(localStorage.getItem('porhacer_preview_plans')).find(plan=>plan.type==='itinerary')`);
    await click('Mis planes');
    await evaluate(`document.querySelectorAll('.personal-section-switch button')[1].click()`);
    await until(`!!document.querySelector('.plan-edit-action')`);
    await evaluate(`document.querySelector('.plan-edit-action').click()`);
    await until(`!!document.querySelector('.modal-content form input')`);
    assert.equal(await evaluate(`document.querySelectorAll('.modal-content form input,.modal-content form textarea,.modal-content form select').length`), 1);
    await fill('.modal-content input[maxlength="100"]', 'Itinerario renombrado');
    await evaluate(`document.querySelector('.modal-content form').requestSubmit()`);
    await until(`!document.querySelector('.modal-content')`);
    const itineraryAfterEdit = await evaluate(`JSON.parse(localStorage.getItem('porhacer_preview_plans')).find(plan=>plan.type==='itinerary')`);
    assert.equal(itineraryAfterEdit.title, 'Itinerario renombrado');
    assert.deepEqual({ ...itineraryAfterEdit, title: itineraryBeforeEdit.title }, itineraryBeforeEdit);
    await click('Inicio');
    await call('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    const mobile = await evaluate(`({viewport:innerWidth,width:document.documentElement.scrollWidth,columns:getComputedStyle(document.querySelector('.cards-grid')).gridTemplateColumns})`);
    assert.ok(mobile.width <= mobile.viewport, JSON.stringify(mobile));
    await evaluate(`document.querySelector('.plan-card').scrollIntoView()`);
    const screenshot = await call('Page.captureScreenshot', { format: 'png' });
    await writeFile(new URL('mobile-catalog.png', folder), Buffer.from(screenshot.data, 'base64'));
    await call('Page.reload', { ignoreCache: true });
    await until(`!!document.querySelector('input[type=search]') && document.querySelector('#discover-plans').textContent.includes('129 ideas')`);
    await call('Emulation.setDeviceMetricsOverride', { width: 1366, height: 900, deviceScaleFactor: 1, mobile: false });
    await until(`document.querySelectorAll('.plan-card').length===6`);
    const desktop = await evaluate(`({viewport:innerWidth,width:document.documentElement.scrollWidth,columns:getComputedStyle(document.querySelector('.cards-grid')).gridTemplateColumns.split(' ').length})`);
    assert.equal(desktop.columns, 3);
    assert.ok(desktop.width <= desktop.viewport);
    assert.deepEqual(exceptions, []);
    console.log(JSON.stringify({ originalPlans: 129, detailsOpened: details, localCrud: 'passed', favorites: 'passed', calendar: 'passed', memories: 'passed', itineraries: 'passed', mobile, desktop, javascriptExceptions: exceptions, firebase: 'Not tested remotely: local preview, no Firestore writes', screenshot: '.browser-check/mobile-catalog.png' }, null, 2));
  }
} finally {
  socket?.close();
  browser.kill();
  if (typeof server.close === 'function') await server.close();
  else await new Promise((resolve) => server.httpServer.close(resolve));
}
