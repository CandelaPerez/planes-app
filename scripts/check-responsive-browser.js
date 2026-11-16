import { toPlanCards } from '../src/services/baData.js';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, mkdtemp, writeFile, readFile } from 'node:fs/promises';
import { build, createServer, preview } from 'vite';
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
// Compile an isolated preview without account credentials or production writes.
const isolatedBuild = globalThis.process.argv.includes('--isolated-build');
const testOutDir = '.browser-check/verified-build';
if (isolatedBuild) await build({ define: { 'import.meta.env.VITE_USE_FIREBASE': '"false"' }, build: { outDir: testOutDir } });
const server = production || isolatedBuild
  ? await preview({ ...(isolatedBuild ? { build: { outDir: testOutDir } } : {}), preview: { host: '127.0.0.1', port: 0 } })
  : await createServer({ define: { 'import.meta.env.VITE_USE_FIREBASE': '"false"' }, server: { host: '127.0.0.1', port: 0, hmr: false, ws: false, watch: { ignored: ['**/.browser-check/**'] } } });
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
  const first={...reviewedPlans.find(p=>p.id==='badata-food-1362'),catalogId:'badata-food-1362',savedOrigin:'verified-catalog',status:'realizado',favorite:true,rating:4,scheduledAt:new Date().toISOString()};
  const second={...reviewedPlans.find(p=>p.id==='badata-food-905'),catalogId:'badata-food-905',savedOrigin:'verified-catalog',status:'pendiente'};
  const trip={id:'responsive-trip',title:'Un recorrido para compartir',type:'itinerary',items:[first,second],image:first.image,status:'pendiente'};
  const custom={id:'responsive-custom',title:'Mi salida personalizada',description:'Una salida con amigos',location:'Buenos Aires',image:first.image,savedOrigin:'custom',status:'pendiente'};
  const seed=[first,second,trip,custom];
  await call('Page.addScriptToEvaluateOnNewDocument',{source:'if(!localStorage.getItem("responsive-seeded")){localStorage.setItem("porhacer_preview_plans",'+JSON.stringify(JSON.stringify(seed))+');localStorage.setItem("responsive-seeded","true");}'});
  await call('Page.navigate',{url:origin});await until("!!document.querySelector('.discovery-section .plan-card')");
  const click=async text=>evaluate("[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==="+JSON.stringify(text)+").click()");
  const fill=async(selector,value)=>evaluate("(()=>{const el=document.querySelector("+JSON.stringify(selector)+");Object.getOwnPropertyDescriptor(el.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,'value').set.call(el,"+JSON.stringify(value)+");el.dispatchEvent(new Event('input',{bubbles:true}));})()");
  const capture=async name=>{await new Promise(resolve=>setTimeout(resolve,250));const shot=await call('Page.captureScreenshot',{format:'png'});await writeFile(new URL(name+'.png',folder),Buffer.from(shot.data,'base64'));};
  const noOverflow=async name=>{
    const result=await evaluate("({width:innerWidth,scroll:document.documentElement.scrollWidth,offenders:[...document.querySelectorAll('main *,.navbar *')].filter(e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return s.display!=='none'&&r.width>0&&(r.right>innerWidth+1||r.left < -1);}).slice(0,12).map(e=>({tag:e.tagName,class:e.className,width:e.getBoundingClientRect().width}))})");
    assert.ok(result.scroll<=result.width,name+': '+JSON.stringify(result));
  };
  const stickyHeader=async label=>{
    if(!await evaluate("matchMedia('(max-width:760px)').matches"))return;
    const height=await evaluate("document.querySelector('.navbar').getBoundingClientRect().height");
    for(const y of [200,700,1400]){
      await evaluate('window.scrollTo(0,'+y+')');
      assert.ok(await evaluate("(()=>{const h=document.querySelector('.navbar'),r=h.getBoundingClientRect();return Math.abs(r.top)<1&&getComputedStyle(h).position==='sticky'&&getComputedStyle(h).backgroundColor==='rgb(255, 255, 255)'&&document.elementFromPoint(r.left+10,r.top+10).closest('.navbar')===h;})()"),label+' sticky header');
      assert.equal(await evaluate("document.querySelector('.navbar').getBoundingClientRect().height"),height);
    }
    await evaluate("window.scrollTo(0,0)");
  };
  const modal=async name=>{await until("!!document.querySelector('.modal-overlay .modal-content')");
    assert.ok(await evaluate("(()=>{const m=document.querySelector('.modal-overlay .modal-content'),r=m.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight+1&&m.scrollWidth<=m.clientWidth;})()"),name);
    await noOverflow(name);};
  const widths=[375,390,430,768,1024,1366];const results=[];
  for(const width of widths){
    await call('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:width<=430});
    await click('Inicio');await until("!!document.querySelector('.discovery-section')");
    await evaluate("window.scrollTo(0,0)");await noOverflow(width+' home');await stickyHeader(width+' home');
    if(width<=430){
      assert.equal(await evaluate("getComputedStyle(document.querySelector('.navbar nav')).position"),'fixed');
      assert.ok(await evaluate("(()=>{const brand=document.querySelector('.nav-brand').getBoundingClientRect(),account=document.querySelector('.nav-account').getBoundingClientRect();return brand.right+4<=account.left&&account.right<=innerWidth;})()"),'Header buttons must not overlap the brand');
      assert.ok(await evaluate("[...document.querySelectorAll('.nav-account .btn')].every(b=>b.getBoundingClientRect().height>=36&&b.getBoundingClientRect().height<44&&b.scrollWidth<=b.clientWidth)"));
      assert.equal(await evaluate("getComputedStyle(document.querySelector('.cards-grid')).gridTemplateColumns.split(' ').length"),1);
      assert.ok(await evaluate("[...document.querySelectorAll('.nav-btn')].every(b=>b.getBoundingClientRect().height>=40)"));
      assert.ok(await evaluate("(()=>{const filters=[...document.querySelectorAll('.category-filter-btn')],top=filters[0].getBoundingClientRect().top;return filters.length===5&&filters.every(b=>Math.abs(b.getBoundingClientRect().top-top)<1&&b.scrollWidth<=b.clientWidth&&b.getBoundingClientRect().height>=40);})()"),'All five categories fit one row without clipping');
      assert.ok(await evaluate("(()=>{const s=document.querySelector('.idea-tool select'),r=s.getBoundingClientRect();return r.width<=192&&r.height<=34&&s.options.length===4;})()"),'Compact itinerary selector retains all options');
      assert.ok(await evaluate("(()=>{const original=document.querySelector('.idea-tool select'),a=original.getBoundingClientRect(),style=getComputedStyle(original);return [...document.querySelectorAll('.discovery-filters select')].every(s=>{const b=s.getBoundingClientRect(),other=getComputedStyle(s);return a.width===b.width&&a.height===b.height&&style.fontSize===other.fontSize&&style.padding===other.padding&&style.lineHeight===other.lineHeight;});})()"),'Itinerary and discovery selectors must have identical dimensions and text styles');
      await evaluate("document.fonts.load('52px Zeyada')");assert.ok(await evaluate("document.fonts.check('52px Zeyada')"));
    }
    assert.equal(await evaluate("document.querySelectorAll('select[aria-label=\"Filtrar por tipo de lugar\"]').length"),0);
    await capture('responsive-'+width+'-home');
    await evaluate("document.querySelector('.discovery-section').scrollIntoView({block:'start',behavior:'instant'})");
    if(width<=430)assert.ok(await evaluate("document.querySelector('.discovery-section').getBoundingClientRect().top>=document.querySelector('.navbar').getBoundingClientRect().bottom"),'Anchored discovery title stays below sticky header');
    await capture('responsive-'+width+'-categories');
    await evaluate("document.querySelector('.discovery-section .plan-card-actions button').click()");await modal(width+' detail');
    const displayedImage=await evaluate("document.querySelector('.plan-detail-image').getAttribute('src')");
    const creditedPlan=reviewedPlans.find(p=>p.image===displayedImage);assert.ok(creditedPlan);
    assert.ok(await evaluate("(()=>{const m=document.querySelector('.modal-overlay > .plan-detail-modal');return !m.querySelector('[data-photo-credit]')&&!m.querySelector('.photo-credit')&&!/Foto:|Verificaci|Archivo:|Descarga:/.test(m.textContent)&&[...m.querySelectorAll('a')].every(a=>!a.href.includes('commons.wikimedia.org')&&!a.href.includes('creativecommons.org'));})()"));
    await capture('clean-detail-'+width);
    await evaluate("document.querySelector('.photo-credits-link').click()");
    await until("!!document.querySelector('dialog.credits-dialog[open]')");
    const credit=await evaluate("(()=>{const d=document.querySelector('dialog.credits-dialog');return {count:d.querySelectorAll('[data-credit-plan-id]').length,text:d.textContent,links:[...d.querySelectorAll('a')].map(a=>a.href),width:d.getBoundingClientRect().width};})()");
    assert.equal(credit.count,1);assert.ok(credit.text.includes(creditedPlan.photograph.author));
    assert.ok(credit.text.includes(creditedPlan.photograph.commonsTitle.replace(/^File:/,'')));
    assert.ok(credit.links.includes(creditedPlan.photograph.sourceUrl));assert.ok(credit.links.includes(creditedPlan.photograph.licenseUrl));assert.ok(credit.width<=width);
    await evaluate("document.querySelector('dialog.credits-dialog .modal-close').click()");await until("!document.querySelector('dialog.credits-dialog')");
    assert.equal(await evaluate("document.querySelector('.plan-detail-image').getAttribute('src')"),displayedImage);
    await evaluate("document.querySelector('.modal-overlay > .modal-content .modal-close').click()");
    await click('Mis planes');await noOverflow(width+' plans');await stickyHeader(width+' plans');await evaluate("window.scrollTo(0,0)");await capture('responsive-'+width+'-plans');
    await evaluate("document.querySelector('#saved-plan-'+"+JSON.stringify(second.id)+"+' .plan-edit-action').click()");await modal(width+' edit plan');await click('Cancelar');
    await evaluate("document.querySelector('#saved-plan-'+"+JSON.stringify(second.id)+"+' .plan-calendar-action').click()");await modal(width+' schedule');
    await evaluate("document.querySelector('.schedule-modal input[type=date]').focus()");await modal(width+' focused schedule');await click('Cancelar');
    await evaluate("document.querySelectorAll('.personal-section-switch button')[1].click()");
    await evaluate("document.querySelector('.itinerary-edit-button').click()");await modal(width+' itinerary');await capture('responsive-'+width+'-itinerary');await click('Cancelar');
    await click('Calendario');await noOverflow(width+' calendar');await stickyHeader(width+' calendar');
    assert.equal(await evaluate("document.querySelectorAll('.calendar-day').length"),42);
    await evaluate("window.scrollTo(0,0)");await capture('responsive-'+width+'-calendar');
    await click('Recuerdos');await noOverflow(width+' memories');await stickyHeader(width+' memories');await capture('responsive-'+width+'-memories');
    assert.ok(await evaluate("!!document.querySelector('.photo-upload input[type=file]')&&document.querySelectorAll('.rating-stars.interactive button').length===5"));
    await click('+ Crear plan');await modal(width+' create');await capture('responsive-'+width+'-form');await click('Cancelar');
    results.push({width,sections:true,forms:true,calendar:true,memories:true,noOverflow:true});
    await click('Mis planes');await evaluate("document.querySelectorAll('.personal-section-switch button')[0].click()");
  }
  // Actual reversible interactions at iPhone width, using the existing components.
  await call('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
  await click('+ Crear plan');await fill('.modal-content input[maxlength="100"]','Mobile test plan');
  await fill('.modal-content textarea','Created on mobile');
  await evaluate("(()=>{const input=document.querySelectorAll('.modal-content input[maxlength=\"100\"]')[1];Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'Buenos Aires');input.dispatchEvent(new Event('input',{bubbles:true}));})()");
  await evaluate("document.querySelector('.modal-content form').requestSubmit()");await until("!document.querySelector('.modal-overlay')");
  const created=await evaluate("JSON.parse(localStorage.getItem('porhacer_preview_plans')).find(p=>p.title==='Mobile test plan')");assert.ok(created);
  await evaluate("document.querySelector('#saved-plan-'+"+JSON.stringify(created.id)+"+' .fav-btn').click()");
  await evaluate("window.confirm=()=>true;document.querySelector('#saved-plan-'+"+JSON.stringify(created.id)+"+' .saved-plan-delete').click()");
  assert.ok(!await evaluate("JSON.parse(localStorage.getItem('porhacer_preview_plans')).some(p=>p.id==="+JSON.stringify(created.id)+")"));
  await click('Recuerdos');
  await evaluate("document.querySelectorAll('.rating-stars.interactive button')[4].click()");
  assert.equal(await evaluate("JSON.parse(localStorage.getItem('porhacer_preview_plans')).find(p=>p.id==='badata-food-1362').rating"),5);
  await evaluate("document.querySelector('.comment-label textarea').focus()");
  await fill('.comment-label textarea','A memory written from mobile');
  await evaluate("document.querySelector('.comment-label textarea').blur()");
  assert.equal(await evaluate("JSON.parse(localStorage.getItem('porhacer_preview_plans')).find(p=>p.id==='badata-food-1362').comment"),'A memory written from mobile');
  const dom=await call('DOM.getDocument');const fileNode=await call('DOM.querySelector',{nodeId:dom.root.nodeId,selector:'.photo-upload input[type=file]'});
  const filePath=decodeURIComponent(new URL('../public'+first.image,import.meta.url).pathname).replace(/^\/([A-Za-z]:)/,'$1');
  await call('DOM.setFileInputFiles',{nodeId:fileNode.nodeId,files:[filePath]});
  await until("JSON.parse(localStorage.getItem('porhacer_preview_plans')).find(p=>p.id==='badata-food-1362').image.startsWith('data:image/')");
  await click('+ Crear plan');await call('Emulation.setDeviceMetricsOverride',{width:390,height:480,deviceScaleFactor:1,mobile:true});
  await modal('reduced viewport while typing');
  await evaluate("document.querySelector('.modal-content input').focus();document.querySelector('.modal-content .modal-actions .btn-primary').scrollIntoView({block:'center'})");
  assert.ok(await evaluate("(()=>{const b=document.querySelector('.modal-content .modal-actions .btn-primary'),r=b.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight;})()"));
  await click('Cancelar');
  assert.deepEqual(exceptions,[]);await writeFile(new URL('responsive-results.json',folder),JSON.stringify({resolutions:results,createFavoriteDelete:true,rating:true,comment:true,photoUpload:true,reducedViewport:true,javascriptExceptions:exceptions},null,2));console.log(JSON.stringify(results));
}finally{socket?.close();browser.kill();if(typeof server.close==='function')await server.close();else await new Promise(resolve=>server.httpServer.close(resolve));}
