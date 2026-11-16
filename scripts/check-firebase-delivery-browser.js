import assert from 'node:assert/strict';
import {spawn}from'node:child_process';
import{mkdir,mkdtemp,readFile,writeFile}from'node:fs/promises';
import{createServer}from'vite';
import{tmpdir}from'node:os';import{join}from'node:path';
const accounts=JSON.parse(await readFile('.browser-check/emulator-test-accounts.json','utf8'));
assert.equal(accounts.project,'demo-porhacer-tests');
const folder=new URL('../.browser-check/',import.meta.url);await mkdir(folder,{recursive:true});
const values={VITE_USE_FIREBASE:'true',VITE_FIREBASE_API_KEY:'demo-emulator-key',VITE_FIREBASE_AUTH_DOMAIN:accounts.project+'.firebaseapp.com',VITE_FIREBASE_PROJECT_ID:accounts.project,VITE_FIREBASE_STORAGE_BUCKET:accounts.project+'.appspot.com',VITE_FIREBASE_MESSAGING_SENDER_ID:'123456789',VITE_FIREBASE_APP_ID:'1:123456789:web:demo'};
const testConnections=`
import {connectAuthEmulator as testConnectAuth} from 'firebase/auth';
import {connectFirestoreEmulator as testConnectFirestore,getDocsFromServer as testGetDocs,getDocFromServer as testGetDoc,doc as testDoc} from 'firebase/firestore';
if(db.app.options.projectId!=='demo-porhacer-tests')throw Error('Production disabled in emulator test');
testConnectAuth(auth,'http://127.0.0.1:9099',{disableWarnings:true});
testConnectFirestore(db,'127.0.0.1',8080);
export async function testRating(id){const snap=await testGetDoc(testDoc(db,'plans',id,'ratings',auth.currentUser.uid));return snap.exists()?snap.data():null;}
export async function testSavedDocs(){return(await testGetDocs(collection(db,'users',auth.currentUser.uid,'savedPlans'))).docs.map(d=>({id:d.id,...d.data()}));}
`;
const server=await createServer({define:Object.fromEntries(Object.entries(values).map(([k,v])=>['import.meta.env.'+k,JSON.stringify(v)])),plugins:[{name:'test-local-firebase-only',enforce:'pre',transform(code,id){if(id.replaceAll('\\','/').endsWith('/src/services/firebase.js'))return code+testConnections;}}],server:{host:'127.0.0.1',port:0,hmr:false,ws:false},appType:'spa'});await server.listen();const origin='http://127.0.0.1:'+server.httpServer.address().port;
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
  await call('Emulation.setDeviceMetricsOverride',{width:1366,height:900,deviceScaleFactor:1,mobile:false});
  await call('Page.addScriptToEvaluateOnNewDocument',{source:'localStorage.setItem("porhacer_distinct_plan_photos_v2",JSON.stringify({"badata-food-1362":{image:"/images/plan-placeholder.svg"}}));'});
  await call('Page.navigate',{url:origin});
  const click=async text=>{await evaluate("[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==="+JSON.stringify(text)+").click()");};
  const fill=async(selector,value)=>{await evaluate("(()=>{const input=document.querySelector("+JSON.stringify(selector)+");Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,"+JSON.stringify(value)+");input.dispatchEvent(new Event('input',{bubbles:true}));})()");};
  const login=async email=>{await until("!!document.querySelector('.auth-card input[type=email]')");await fill('.auth-card input[type=email]',email);await fill('.auth-card input[type=password]',accounts.password);await evaluate("document.querySelector('.auth-card form').requestSubmit()");await until("!!document.querySelector('.nav-account')");};
  const docs=()=>evaluate("import('/src/services/firebase.js').then(service=>service.testSavedDocs())");
  await login(accounts.emailA);
  await until("!!document.querySelector('.discovery-section .plan-card')");
  const target='badata-food-905';
  const baseline=await docs();assert.ok(!baseline.some(p=>p.id===target));
  const document=async()=> (await docs()).find(p=>p.id===target);
  const cardClick=async selector=>{await until("!!document.querySelector('#saved-plan-"+target+" "+selector+"')&&!document.querySelector('#saved-plan-"+target+" "+selector+"').disabled");return evaluate("document.querySelector('#saved-plan-"+target+" "+selector+"').click()");};
  await fill('input[type=search]','El Progreso');
  await until("document.querySelectorAll('.discovery-section .plan-card').length===1");
  await evaluate("document.querySelector('.discovery-section .plan-card-actions .btn-primary').click()");
  await until("document.body.textContent.includes('Idea guardada en Mis planes')");
  assert.equal((await document()).status,'pendiente');
  await click('Mis planes');await until("!!document.querySelector('#saved-plan-"+target+"')");
  await cardClick('.fav-btn');await until("document.querySelector('#saved-plan-"+target+" .fav-btn').classList.contains('is-favorite')");
  assert.equal((await document()).favorite,true);
  await cardClick('.plan-status-action');await until("document.querySelector('#saved-plan-"+target+" .status-label').classList.contains('done')");
  assert.equal((await document()).status,'realizado');
  await click('Recuerdos');
  await until("[...document.querySelectorAll('.photo-card')].some(c=>c.textContent.includes('El Progreso'))");
  await until("![...document.querySelectorAll('.photo-card')].find(c=>c.textContent.includes('El Progreso')).querySelectorAll('.rating-stars.interactive button')[3].disabled");
  await evaluate("[...document.querySelectorAll('.photo-card')].find(c=>c.textContent.includes('El Progreso')).querySelectorAll('.rating-stars.interactive button')[3].click()");
  await until("[...document.querySelectorAll('.photo-card')].find(c=>c.textContent.includes('El Progreso')).querySelectorAll('.rating-stars.interactive .selected').length===4");
  assert.equal((await document()).rating,4);
  const rating=await evaluate("import('/src/services/firebase.js').then(s=>s.testRating('"+target+"'))");assert.equal(rating.value,4);
  await click('Mis planes');
  await cardClick('.plan-calendar-action');await until("!!document.querySelector('.schedule-modal')");
  await evaluate("document.querySelector('.schedule-modal form').requestSubmit()");
  await until("!!document.querySelector('.calendar-event-card')");assert.ok((await document()).scheduledAt);
  const persisted=await document();
  await evaluate("window.__porHacerReloadMarker=true");await call('Page.reload',{ignoreCache:true});await until("!window.__porHacerReloadMarker&&document.readyState==='complete'");await until("!!document.querySelector('.nav-account')");
  await click('Mis planes');await until("!!document.querySelector('#saved-plan-"+target+"')");
  assert.deepEqual(await document(),persisted);
  assert.ok(await evaluate("document.querySelector('#saved-plan-"+target+" .fav-btn').classList.contains('is-favorite')&&document.querySelector('#saved-plan-"+target+" .status-label').classList.contains('done')"));
  assert.ok(await evaluate("!document.querySelector('#saved-plan-old-catalog-document')&&!document.querySelector('#saved-plan-coverage_1_1_1')"));
  await click('Calendario');assert.ok(!await evaluate("document.body.textContent.includes('Plan antiguo')"));
  await click('Recuerdos');await until("!!document.querySelector('.photo-card')");assert.ok(!await evaluate("document.body.textContent.includes('Plan antiguo')"));
  await click('Mis planes');await evaluate("window.confirm=()=>true");await cardClick('.saved-plan-delete');
  await until("!document.querySelector('#saved-plan-"+target+"')");assert.equal(await document(),undefined);
  await evaluate("window.__porHacerReloadMarker=true");await call('Page.reload',{ignoreCache:true});await until("!window.__porHacerReloadMarker&&document.readyState==='complete'");await until("!!document.querySelector('.nav-account')");
  await click('Mis planes');await until("!!document.querySelector('.personal-section-switch')");assert.equal(await document(),undefined);
  // Removing a saved current plan deliberately leaves its rating untouched.
  assert.equal((await evaluate("import('/src/services/firebase.js').then(s=>s.testRating('"+target+"'))")).value,4);
  assert.deepEqual((await docs()).sort((a,b)=>a.id.localeCompare(b.id)),baseline.sort((a,b)=>a.id.localeCompare(b.id)));
  assert.deepEqual(exceptions,[]);
  const result={project:accounts.project,emulator:true,serverReads:true,create:true,favorite:true,status:true,calendar:true,ratingDocument:true,reloadPersistence:true,delete:true,deleteSurvivesReload:true,ratingsRetained:true,legacyHidden:true,existingDocumentsUnchanged:true,productionTouched:false,javascriptExceptions:exceptions};
  await writeFile(new URL('firebase-delivery-result.json',folder),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}finally{socket?.close();browser.kill();await server.close();}
