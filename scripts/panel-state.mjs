import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export function fingerprint() {
  const hash = crypto.createHash('sha256');
  function visit(relative) {
    const absolute = path.join(root, relative);
    if (!fs.existsSync(absolute)) return;
    if (fs.statSync(absolute).isDirectory()) for (const name of fs.readdirSync(absolute).sort()) visit(relative + '/' + name);
    else hash.update(relative).update(fs.readFileSync(absolute));
  }
  for (const file of ['client/src', 'client/index.html', 'client/vite.config.js', 'client/package.json', 'package-lock.json', 'scripts/panel-state.mjs']) visit(file);
  return hash.digest('hex');
}
export function panelIsCurrent() {
  try { return fs.existsSync(path.join(root, 'client/dist/index.html')) && JSON.parse(fs.readFileSync(path.join(root, 'client/dist/build-meta.json'), 'utf8')).fingerprint === fingerprint(); }
  catch { return false; }
}
