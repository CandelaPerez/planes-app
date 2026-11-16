import assert from 'node:assert/strict';
import {spawn}from'node:child_process';
import{mkdir,mkdtemp,writeFile}from'node:fs/promises';
import{createServer}from'vite';
import{tmpdir}from'node:os';import{join}from'node:path';
const accounts={project:'demo-porhacer-tests'};
const responsive=globalThis.process.argv.includes('--responsive');
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
  await call('Emulation.setDeviceMetricsOverride',{width:responsive?390:1366,height:844,deviceScaleFactor:1,mobile:responsive});
  await call('Page.addScriptToEvaluateOnNewDocument',{source:'localStorage.setItem("porhacer_distinct_plan_photos_v2",JSON.stringify({"badata-food-1362":{image:"/images/plan-placeholder.svg"}}));'});
  await call('Page.navigate',{url:origin});
  const click=async text=>{await evaluate("[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==="+JSON.stringify(text)+").click()");};
  const fill=async(selector,value)=>{await evaluate("(()=>{const input=document.querySelector("+JSON.stringify(selector)+");Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,"+JSON.stringify(value)+");input.dispatchEvent(new Event('input',{bubbles:true}));})()");};
  const login=async email=>{await until("!!document.querySelector('.auth-card input[type=email]')");await fill('.auth-card input[type=email]',email);await fill('.auth-card input[type=password]',accounts.password);await evaluate("document.querySelector('.auth-card form').requestSubmit()");await until("!!document.querySelector('.nav-account')");};
  const docs=()=>evaluate("import('/src/services/firebase.js').then(service=>service.testSavedDocs())");
  const captureResponsive=async name=>{
    await new Promise(resolve=>setTimeout(resolve,250));
    const shot=await call('Page.captureScreenshot',{format:'png'});
    await writeFile(new URL(name+'.png',folder),Uint8Array.from(atob(shot.data),c=>c.charCodeAt(0)));
  };
  const email='eight-records-'+Date.now()+'@porhacer.example';
  accounts.password='Synthetic-eight-records-2026';
  await until("!!document.querySelector('.auth-card input[type=email]')");
  if(responsive){
    for(const width of [375,390,430,768,1366]){
      await call('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:width<=430});
      assert.ok(await evaluate("document.documentElement.scrollWidth<=innerWidth"));
      assert.ok(await evaluate("(()=>{const r=document.querySelector('.auth-card').getBoundingClientRect();return r.left>=0&&r.right<=innerWidth;})()"));
      await evaluate("document.querySelectorAll('.auth-mode-switch button')[1].click()");
      await until("document.querySelectorAll('.auth-card input[type=password]').length===2");
      assert.ok(await evaluate("document.documentElement.scrollWidth<=innerWidth"));
      if(width===390)await captureResponsive('responsive-firebase-390-register');
      await evaluate("document.querySelectorAll('.auth-mode-switch button')[0].click()");
      await until("document.querySelectorAll('.auth-card input[type=password]').length===1");
    }
    await call('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
  }
  await evaluate("import('/src/services/firebase.js').then(s=>s.registerAccount("+JSON.stringify(email)+","+JSON.stringify(accounts.password)+")).then(()=>true)");
  await until("!!document.querySelector('.nav-account')");
  await until("!document.querySelector('.loading-message')");
  for(const name of ['El Progreso','La Flor de Barracas','Bar El Esta\u00f1o 1880']){
    await fill('input[type=search]',name);
    await until("document.querySelectorAll('.discovery-section .plan-card').length===1");
    await until("!!document.querySelector('.discovery-section .plan-card-actions .btn-primary')&&!document.querySelector('.discovery-section .plan-card-actions .btn-primary').disabled");
    await evaluate("document.querySelector('.discovery-section .plan-card-actions .btn-primary').click()");
    try { await until("document.querySelector('.discovery-section .plan-card-actions').textContent.includes('En mis planes')"); }
    catch(error){console.log(JSON.stringify({name,view:await evaluate("({error:document.querySelector('.app-alert.error')?.textContent,notice:document.querySelector('.app-alert.success')?.textContent,loading:!!document.querySelector('.loading-message'),action:document.querySelector('.discovery-section .plan-card-actions')?.textContent,title:document.querySelector('.discovery-section .card-title')?.textContent})"),documents:await docs()}));throw error;}
  }
  await fill('input[type=search]','');
  for(let index=0;index<5;index++){
    for(let retry=0;retry<30;retry++){
      await click('Sugerir itinerario');
      await until("document.querySelectorAll('.itinerary-list li').length===2");
      if(await evaluate("[...document.querySelectorAll('.idea-tool button')].some(b=>b.textContent==='Guardar itinerario'&&!b.disabled)"))break;
    }
    await click('Guardar itinerario');
    await until("[...document.querySelectorAll('.idea-tool button')].some(b=>b.textContent==='Itinerario guardado')");
  }
  const verify=async()=>{
    await until("window.porHacerDiagnostico().then(r=>r.serverConfirmed&&!r.screen.loading&&r.screen.rawDocuments===8)");
    const report=await evaluate("window.porHacerDiagnostico()");
    assert.equal(report.projectId,accounts.project);assert.equal(report.mode,'firestore');assert.equal(report.serverConfirmed,true);
    assert.equal(report.uid,report.screen.uid);assert.equal(report.total,8);assert.equal(report.plans,3);assert.equal(report.itineraries,5);
    assert.equal(report.screen.rawDocuments,8);assert.equal(report.screen.visiblePlans,3);assert.equal(report.screen.visibleItineraries,5);
    assert.equal(new Set(report.documents.map(d=>d.id)).size,8);return report;
  };
  await verify();const original=await docs();
  await evaluate("window.__porHacerReloadMarker=true");await call('Page.reload',{ignoreCache:true});await until("!window.__porHacerReloadMarker&&document.readyState==='complete'");await until("!!document.querySelector('.nav-account')");
  await until("window.porHacerDiagnostico&&!!document.querySelector('.discovery-section .plan-card')");await verify();
  if(responsive){
    for(const width of [375,390,430]){
      await call('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:true});
      assert.equal(await evaluate("getComputedStyle(document.querySelector('.desktop-sign-out')).display"),'none');
      await evaluate("window.scrollTo(0,600)");
      assert.ok(await evaluate("Math.abs(document.querySelector('.navbar').getBoundingClientRect().top)<1"));
      await evaluate("document.querySelector('.nav-account > .btn-primary').click()");
      await until("!!document.querySelector('.modal-overlay')");
      assert.ok(await evaluate("(()=>{const m=document.querySelector('.modal-content'),r=m.getBoundingClientRect();return document.elementFromPoint(r.left+20,r.top+20).closest('.modal-content')===m;})()"));
      await click('Cancelar');await click('Inicio');await evaluate("window.scrollTo(0,600)");

      assert.ok(await evaluate("(()=>{const brand=document.querySelector('.nav-brand').getBoundingClientRect(),account=document.querySelector('.nav-account').getBoundingClientRect();return brand.right+8<=account.left&&account.right<=innerWidth-16;})()"));
      await evaluate("document.querySelector('.account-menu-trigger').click()");
      await until("!!document.querySelector('.account-menu-dropdown')");
      if(width===390)await captureResponsive('responsive-firebase-390-profile-menu');
      assert.ok(await evaluate("(()=>{const r=document.querySelector('.account-menu-dropdown').getBoundingClientRect();return r.left>=0&&r.right<=innerWidth;})()"));
      await evaluate("document.querySelector('.account-menu-trigger').click()");
      assert.equal(await evaluate("document.querySelectorAll('.account-menu-dropdown').length"),0);
      await evaluate("document.querySelector('.account-menu-trigger').click()");
      await evaluate("document.body.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}))");
      assert.equal(await evaluate("document.querySelectorAll('.account-menu-dropdown').length"),0);
      await evaluate("document.querySelector('.account-menu-trigger').click()");
      await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
      assert.equal(await evaluate("document.querySelectorAll('.account-menu-dropdown').length"),0);
    }
    await evaluate("document.querySelector('.account-menu-trigger').click()");
    await evaluate("document.querySelector('.account-menu-dropdown button').click()");
  }else await click('Cerrar sesion');
  await login(email);await until("!!document.querySelector('.discovery-section .plan-card')");await verify();
  await click('Mis planes');await evaluate("document.querySelectorAll('.personal-section-switch button')[1].click()");
  await until("document.querySelectorAll('.itinerary-edit-button').length===5");
  const itinerary=original.find(p=>p.type==='itinerary');
  await evaluate("document.querySelector('#saved-plan-"+itinerary.id+" .itinerary-edit-button').click()");
  await until("!!document.querySelector('.itinerary-editor')");await fill('.itinerary-editor input[maxlength]','Renamed without duplication');await click('Guardar cambios');
  await until("!document.querySelector('.itinerary-editor')");await verify();assert.equal((await docs()).find(p=>p.id===itinerary.id).title,'Renamed without duplication');
  const edited=await docs();
  await evaluate("window.confirm=()=>true;document.querySelector('#saved-plan-"+itinerary.id+" .saved-plan-delete').click()");
  await until("document.querySelectorAll('.itinerary-edit-button').length===4");assert.equal((await docs()).length,7);
  await evaluate("window.__porHacerReloadMarker=true");await call('Page.reload',{ignoreCache:true});await until("!window.__porHacerReloadMarker&&document.readyState==='complete'");await until("!!document.querySelector('.nav-account')");
  assert.equal((await docs()).length,7);assert.ok(!(await docs()).some(p=>p.id===itinerary.id));
  // Restore only this synthetic fixture, using the same ID, to finish at 3 + 5.
  const restore=edited.find(p=>p.id===itinerary.id);delete restore.updatedAt;
  await evaluate("import('/src/services/firebase.js').then(s=>s.savePlan(s.auth.currentUser.uid,"+JSON.stringify(restore)+"))");
  await until("!!document.querySelector('.discovery-section .plan-card')");await verify();
  await evaluate("window.__porHacerReloadMarker=true");await call('Page.reload',{ignoreCache:true});await until("!window.__porHacerReloadMarker&&document.readyState==='complete'");await until("!!document.querySelector('.nav-account')");await until("!!document.querySelector('.discovery-section .plan-card')");await verify();
  if(responsive){
    for(const width of [375,390,430,768,1366]){
      await call('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:width<=430});
      await verify();assert.ok(await evaluate("document.documentElement.scrollWidth<=innerWidth"));
      await click('Mis planes');await evaluate("document.querySelectorAll('.personal-section-switch button')[1].click()");
      await until("document.querySelectorAll('.itinerary-edit-button').length===5");
      assert.ok(await evaluate("document.documentElement.scrollWidth<=innerWidth"));
      if(width===390)await captureResponsive('responsive-firebase-390-itineraries');
      await click('Inicio');
      if(width===390)await captureResponsive('responsive-firebase-390-home');
    }
  }
  assert.deepEqual(exceptions,[]);
  const result={emulator:true,project:accounts.project,responsive,profileMenu:responsive,threePlans:3,fiveItineraries:5,serverDocuments:8,uidMatches:true,reload:true,logoutLogin:true,editSameDocument:true,deleteSyntheticOnly:true,deletePersistsAfterReload:true,restoreSameIdWithoutDuplicates:true,productionTouched:false,javascriptExceptions:exceptions};
  await writeFile(new URL('eight-records-sync-result.json',folder),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}finally{socket?.close();browser.kill();await server.close();}
