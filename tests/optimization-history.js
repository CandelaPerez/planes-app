import { readFile } from 'node:fs/promises';
const rows = JSON.parse(await readFile(new URL('../docs/optimization/images.json', import.meta.url), 'utf8'));
// Retain historical snapshots: only documented compression fields may differ.
export function historicalPhoto(photo) {
 const row = rows.find(row => row.path === photo.localPath);
 return row ? {...photo, bytes:row.before, sha256:row.originalSha256, presentation:row.originalPresentation} : photo;
}
export function historicalPlan(plan) { return {...plan, photograph:historicalPhoto(plan.photograph)}; }
