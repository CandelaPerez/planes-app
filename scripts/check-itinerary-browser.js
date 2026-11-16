import { Buffer } from 'node:buffer';
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
import {connectFirestoreEmulator as testConnectFirestore,getDocs as testGetDocs} from 'firebase/firestore';
if(db.app.options.projectId!=='demo-porhacer-tests')throw Error('Production disabled in emulator test');
testConnectAuth(auth,'http://127.0.0.1:9099',{disableWarnings:true});
testConnectFirestore(db,'127.0.0.1',8080);
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
  const text=async(selector,value)=>evaluate("(()=>{const input=document.querySelector("+JSON.stringify(selector)+");Object.getOwnPropertyDescriptor(input.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,'value').set.call(input,"+JSON.stringify(value)+");input.dispatchEvent(new Event('input',{bubbles:true}));})()");
  const itinerarySection=async()=>{await click('Mis planes');await evaluate("document.querySelectorAll('.personal-section-switch button')[1].click()");};
  const edit=async id=>{await evaluate("document.querySelector('#saved-plan-"+id+" .itinerary-edit-button').click()");await until("!!document.querySelector('.itinerary-editor')");};
  await login(accounts.emailA);
  await until("document.querySelectorAll('.discovery-section .plan-card').length>0");
  const initial=await docs();assert.equal(initial.length,5);
  await evaluate("import('/src/services/firebase.js').then(async s=>{const all=await s.testSavedDocs();const custom=all.find(p=>p.id==="+JSON.stringify(accounts.customId)+");const old=all.find(p=>p.id==="+JSON.stringify(accounts.itineraryId)+");await s.updateSavedPlan(s.auth.currentUser.uid,old.id,{items:[...old.items,custom],favorite:true,comment:'Protected itinerary memory',scheduledAt:'2027-01-05T15:00:00Z'});})");
  await click('Sugerir itinerario');await until("document.querySelectorAll('.itinerary-list li').length===2");
  await click('Guardar itinerario');await until("document.body.textContent.includes('Itinerario guardado como un plan')");
  const created=(await docs()).find(p=>p.type==='itinerary'&&p.id!==accounts.itineraryId);assert.ok(created);assert.equal((await docs()).length,6);
  await itinerarySection();await until("document.querySelectorAll('.itinerary-edit-button').length===2");
  const before=(await docs()).find(p=>p.id===accounts.itineraryId);
  await edit(accounts.itineraryId);
  assert.equal(await evaluate("document.querySelectorAll('.itinerary-editor-items > li').length"),2);
  assert.ok(await evaluate("document.querySelector('.itinerary-unavailable').textContent.includes('Ya no')"));
  await text('.itinerary-editor input[maxlength]','Cancelado');
  await text('.itinerary-editor textarea','No guardar');
  await evaluate("document.querySelector('.itinerary-editor-items li button[aria-label^=Quitar]').click()");
  await click('Cancelar');await until("!document.querySelector('.itinerary-editor')");
  assert.deepEqual((await docs()).find(p=>p.id===accounts.itineraryId),before);
  await edit(accounts.itineraryId);
  await text('.itinerary-editor input[maxlength]','Salida reorganizada');
  await text('.itinerary-editor textarea','Café y encuentro personal');
  await text('.itinerary-editor input[type=datetime-local]','2027-05-10T14:30');
  await text('.itinerary-editor input[type=search]','Tortoni');
  await until("document.querySelectorAll('.itinerary-editor-catalog > li').length===1");
  await evaluate("document.querySelector('.itinerary-editor-catalog button').click()");
  await until("document.querySelectorAll('.itinerary-editor-items > li').length===3");
  assert.equal(await evaluate("document.querySelectorAll('.itinerary-editor-catalog button').length"),0);
  await evaluate("document.querySelector('.itinerary-editor-items li button[aria-label^=Bajar]').click()");
  await evaluate("document.querySelectorAll('.itinerary-editor-items li')[1].querySelector('button[aria-label^=Quitar]').click()");
  await click('Guardar cambios');await until("!document.querySelector('.itinerary-editor')");
  let edited=(await docs()).find(p=>p.id===accounts.itineraryId);
  assert.equal(edited.title,'Salida reorganizada');assert.equal(edited.description,'Café y encuentro personal');
  assert.deepEqual(edited.items.map(p=>p.id),[accounts.customId,accounts.currentId]);
  assert.equal(edited.favorite,true);assert.equal(edited.comment,before.comment);assert.equal(edited.image,before.image);
  assert.equal(edited.scheduledAt,await evaluate("new Date('2027-05-10T14:30').toISOString()"));
  assert.equal((await docs()).length,6);
  await call('Page.reload',{ignoreCache:true});await until("!!document.querySelector('.nav-account')");
  await itinerarySection();await until("document.body.textContent.includes('Salida reorganizada')");
  await edit(accounts.itineraryId);
  await call('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
  assert.ok(await evaluate("document.querySelector('.itinerary-editor').getBoundingClientRect().width<=390 && document.querySelector('.itinerary-editor').scrollWidth<=document.querySelector('.itinerary-editor').clientWidth"));
  const screenshot=await call('Page.captureScreenshot',{format:'png'});await writeFile(new URL('itinerary-editor-mobile.png',folder),Buffer.from(screenshot.data,'base64'));
  await text('.itinerary-editor input[type=datetime-local]','');await click('Guardar cambios');await until("!document.querySelector('.itinerary-editor')");
  assert.equal((await docs()).find(p=>p.id===accounts.itineraryId).scheduledAt,null);
  await click('Cerrar sesion');await login(accounts.emailA);await itinerarySection();
  await until("document.body.textContent.includes('Salida reorganizada')");
  assert.deepEqual((await docs()).find(p=>p.id===accounts.itineraryId).items.map(p=>p.id),[accounts.customId,accounts.currentId]);
  await evaluate("window.confirm=()=>true;document.querySelector('#saved-plan-"+created.id+" .saved-plan-delete').click()");
  await until("!document.querySelector('#saved-plan-"+created.id+"')");assert.equal((await docs()).length,5);
  await click('Cerrar sesion');await login(accounts.emailB);
  const rejection=await evaluate("import('/src/services/firebase.js').then(async s=>{try{await s.updateSavedPlan("+JSON.stringify(accounts.uidA)+","+JSON.stringify(accounts.itineraryId)+",{title:'Unauthorized'});return 'allowed';}catch(e){return e.code;}})");
  assert.equal(rejection,'permission-denied');assert.equal((await docs()).length,1);
  assert.deepEqual(exceptions,[]);
  const result={emulator:true,create:true,cancelWithoutWrites:true,editSameDocument:true,addCurrentOnly:true,removeLegacy:true,reorder:true,customPreserved:true,personalStatePreserved:true,scheduleChangedAndCleared:true,reload:true,logoutLogin:true,delete:true,noDuplicates:true,mobile:true,accountIsolation:true,productionTouched:false};
  await writeFile(new URL('itinerary-browser-result.json',folder),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}finally{socket?.close();browser.kill();await server.close();}
