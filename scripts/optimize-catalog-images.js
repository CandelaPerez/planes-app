import { readFile, writeFile, mkdir, mkdtemp } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Buffer } from 'node:buffer';

// Maintenance command, never run during visits or deployments. Original files remain in Git.
const root = new URL('../', import.meta.url);
const paths = ['src/data/baDataPilot.json', 'src/data/baDataPhotos.json'];
const manifests = await Promise.all(paths.map(async path => JSON.parse(await readFile(new URL(path, root), 'utf8'))));
const profile = await mkdtemp(join(tmpdir(), 'porhacer-optimize-'));
const browser = spawn(globalThis.process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', '--disable-gpu', '--no-first-run', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { windowsHide: true });
let socket;
let report;
try { report = JSON.parse(await readFile(new URL('docs/optimization/images.json', root), 'utf8')); } catch (error) { if (error.code !== 'ENOENT') throw error; report = []; }
try {
  const address = await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Chrome startup timeout')), 15000);
    browser.once('error', reject);
    browser.stderr.on('data', data => { const match = /DevTools listening on (ws:\/\/\S+)/.exec(String(data)); if (match) { clearTimeout(timeout); resolve(match[1]); } });
  });
  const targets = await (await fetch(`http://${new URL(address).host}/json/list`)).json();
  socket = new WebSocket(targets.find(target => target.type === 'page').webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  let sequence = 0;
  const pending = new Map();
  socket.onmessage = ({ data }) => { const message = JSON.parse(data); if (pending.has(message.id)) { const { resolve, reject } = pending.get(message.id); pending.delete(message.id); if (message.error) reject(new Error(message.error.message)); else resolve(message.result); } };
  const evaluate = expression => new Promise((resolve, reject) => { const id = ++sequence; pending.set(id, { resolve, reject }); socket.send(JSON.stringify({ id, method: 'Runtime.evaluate', params: { expression, awaitPromise: true, returnByValue: true } })); });
  for (const manifest of manifests) for (const entry of manifest.entries.filter(entry => entry.photo)) {
    const photo = entry.photo;
    if (report.some(row => row.path === photo.localPath)) continue;
    const path = new URL(`public${photo.localPath}`, root);
    const before = await readFile(path);
    if (before.length < 120000) continue;
    const response = await evaluate(`(async () => {
      const image = new Image(); image.src = ${JSON.stringify(`data:image/jpeg;base64,${before.toString('base64')}`)}; await image.decode();
      const canvas = document.createElement('canvas'); canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
      const ctx = canvas.getContext('2d', {willReadFrequently:true}); ctx.drawImage(image,0,0);
      const original = ctx.getImageData(0,0,canvas.width,canvas.height).data;
      for (const quality of [0.75, 0.8, 0.85, 0.9]) {
        ctx.drawImage(image,0,0);
        const data = canvas.toDataURL('image/jpeg', quality);
        const compressed = new Image(); compressed.src = data; await compressed.decode();
        ctx.drawImage(compressed,0,0);
        const pixels = ctx.getImageData(0,0,canvas.width,canvas.height).data;
        let error = 0;
        for (let i=0;i<pixels.length;i++) if (i%4!==3) error += (pixels[i]-original[i])**2;
        const rmse = Math.sqrt(error/(pixels.length*0.75));
        if (rmse <= 5) return {data, width:canvas.width, height:canvas.height, rmse, quality};
      }
      return null;
    })()`);
    if (response.exceptionDetails) throw new Error(JSON.stringify(response.exceptionDetails));
    const result = response.result.value;
    if (!result) continue;
    const after = Buffer.from(result.data.split(',')[1], 'base64');
    if (after.length >= before.length * 0.95 || result.rmse > 5) continue;
    await writeFile(path, after);
    const originalSha256 = photo.sha256;
    const originalPresentation = photo.presentation;
    photo.bytes = after.length;
    photo.sha256 = createHash('sha256').update(after).digest('hex');
    photo.presentation = 'Compresión JPEG de alta calidad, sin cambiar dimensiones ni encuadre. Encuadre de tarjeta mediante CSS.';
    report.push({ originalSha256, originalPresentation, optimizedSha256:photo.sha256, path:photo.localPath, before:before.length, after:after.length, width:result.width, height:result.height, rmse:result.rmse, quality:result.quality });
  }
  for(let i=0;i<paths.length;i++) await writeFile(new URL(paths[i],root), JSON.stringify(manifests[i], null, 2)+'\n');
  await mkdir(new URL('docs/optimization/',root),{recursive:true});
  await writeFile(new URL('docs/optimization/images.json',root),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({ optimized:report.length, before:report.reduce((sum,r)=>sum+r.before,0), after:report.reduce((sum,r)=>sum+r.after,0) }));
} finally { socket?.close(); browser.kill(); }
