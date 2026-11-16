import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, dirname, relative, isAbsolute } from 'node:path';
import { createHash } from 'node:crypto';
import { createServer } from 'vite';
import { cleanupReport } from './lib/saved-cleanup.js';

const args = globalThis.process.argv.slice(2);
const option = name => args[args.indexOf(name) + 1];
const allowed = new Set(['--project', '--out', '--fixture', '--local-export']);
for (let i = 0; i < args.length; i += 2) {
  if (!allowed.has(args[i]) || !args[i + 1] || args[i + 1].startsWith('--')) throw Error('Only read-only audit options are supported');
}
const project = args.includes('--project') ? option('--project') : null;
const input = args.includes('--fixture') ? option('--fixture') : null;
const local = args.includes('--local-export') ? option('--local-export') : null;
if ([Boolean(project), Boolean(input), Boolean(local)].filter(Boolean).length !== 1) throw Error('Choose exactly one: --project ID, --fixture FILE or --local-export FILE');
if (!args.includes('--out')) throw Error('--out FILE is required (private report, do not commit)');
const output = resolve(option('--out'));
const relativeOutput = relative(resolve('.browser-check'), output);
if (relativeOutput.startsWith('..') || isAbsolute(relativeOutput)) throw Error('Reports must be inside ignored .browser-check/');
const vite = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
let admin;
try {
  const { toPlanCards } = await vite.ssrLoadModule('/src/services/baData.js');
  const { CATALOG } = await vite.ssrLoadModule('/src/data/catalog.js');
  const catalog = toPlanCards(JSON.parse(await readFile('public/data/ba-data.json', 'utf8')));
  const originalImages = new Map(CATALOG.map(p => [p.id, p.image]));
  let records = [], ratings = [], source;
  if (input) {
    const fixture = JSON.parse(await readFile(input, 'utf8'));
    records = fixture.records; ratings = fixture.ratings || []; source = 'synthetic-fixture';
  } else if (local) {
    const exported = JSON.parse(await readFile(local, 'utf8'));
    for (const key of ['porhacer_preview_plans', 'porhacer_user_plans']) {
      const value = exported[key];
      const plans = typeof value === 'string' ? JSON.parse(value) : value || [];
      if (!Array.isArray(plans)) throw Error(`Invalid local storage key: ${key}`);
      records.push(...plans.map((data, index) => ({ uid: 'local-browser', path: `${key}/${index}/${data.id || 'unknown'}`, data })));
    }
    source = 'local-export';
  } else {
    const { initializeApp, applicationDefault, deleteApp } = await import('firebase-admin/app');
    const { getFirestore, FieldPath } = await import('firebase-admin/firestore');
    const emulator = globalThis.process.env.FIRESTORE_EMULATOR_HOST;
    if (emulator && !project.startsWith('demo-')) throw Error('Emulator audits require a demo- project');
    admin = { app: initializeApp({ projectId: project, ...(emulator ? {} : { credential: applicationDefault() }) }), deleteApp };
    const db = getFirestore(admin.app);
    const collect = async group => {
      const found = []; let last;
      for (;;) {
        let query = db.collectionGroup(group).orderBy(FieldPath.documentId()).limit(200);
        if (last) query = query.startAfter(last);
        const page = await query.get();
        if (page.empty) break;
        found.push(...page.docs); last = page.docs.at(-1);
      }
      return found;
    };
    for (const doc of await collect('savedPlans')) {
      const match = /^users\/([^/]+)\/savedPlans\/([^/]+)$/.exec(doc.ref.path);
      if (!match) throw Error('Unexpected savedPlans path; review schema before proceeding');
      const data = { ...doc.data(), id: doc.data().id || doc.id };
      records.push({ uid: match[1], path: doc.ref.path, data,
        updateTime: doc.updateTime.toDate().toISOString(), subcollections: (await doc.ref.listCollections()).map(c => c.id) });
    }
    ratings = (await collect('ratings')).map(doc => ({ path: doc.ref.path, data: doc.data() }));
    source = `${emulator ? 'emulator' : 'firestore'}:${project}`;
  }
  const report = cleanupReport(records, catalog, { ratings, originalImages, source });
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, JSON.stringify(report, null, 2), { flag: 'wx' });
  const hash = createHash('sha256').update(await readFile(output)).digest('hex');
  console.log(JSON.stringify({ report: output, sha256: hash, ...report.totals, mode: 'dry-run' }));
} finally {
  if (admin) await admin.deleteApp(admin.app);
  await vite.close();
}
