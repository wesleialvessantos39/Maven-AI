import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { DATA_DIR } from './store.mjs';
import { sha } from './security.mjs';

const auditFile = path.join(DATA_DIR, 'audit.jsonl');
let auditQueue = Promise.resolve();
export function recordAudit(event) {
  auditQueue = auditQueue.catch(() => {}).then(async () => {
    await fs.mkdir(DATA_DIR, { recursive: true });
    let previous = '0'.repeat(64);
    try {
      const data = await fs.readFile(auditFile, 'utf8');
      const last = data.trim().split('\n').at(-1);
      if (last) previous = JSON.parse(last).hash;
      if (Buffer.byteLength(data) > 5_000_000) await fs.rename(auditFile, auditFile + '.1');
    } catch (error) { if (error.code !== 'ENOENT') throw error; }
    const item = { at: new Date().toISOString(), ...event, previous };
    await fs.appendFile(auditFile, JSON.stringify({ ...item, hash: sha(JSON.stringify(item)) }) + '\n', { mode: 0o600 });
  });
  auditQueue.catch(error => console.error('Falha ao registrar auditoria:', error.code || 'registro inválido'));
  return auditQueue;
}
export async function auditEvents() {
  await auditQueue;
  let items = [];
  try { items = (await fs.readFile(auditFile, 'utf8')).trim().split('\n').filter(Boolean).map(line => JSON.parse(line)); }
  catch (error) { if (error.code !== 'ENOENT') return { items: [], valid: false }; }
  let valid = true;
  for (let i = 0; i < items.length; i++) {
    const { hash, ...body } = items[i];
    if (hash !== sha(JSON.stringify(body)) || (i > 0 && body.previous !== items[i - 1].hash)) valid = false;
  }
  return { items: items.slice(-100).reverse(), valid, scope: 'Arquivo atual; hashes detectam alterações, mas não impedem reescrita por quem controla o computador.' };
}

export function installSecurity(app, { port }) {
  const hosts = new Set([`127.0.0.1:${port}`, `localhost:${port}`, '127.0.0.1:5173', 'localhost:5173']);
  const origins = new Set([...hosts].map(host => 'http://' + host));
  const sessions = new Map();
  const buckets = new Map();
  const ttl = 8 * 60 * 60 * 1000;
  app.use((req, res, next) => {
    const requestId = crypto.randomUUID();
    res.set({
      'X-Request-Id': requestId, 'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY', 'Referrer-Policy': 'no-referrer',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
      'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; font-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'",
      'Cache-Control': 'no-store'
    });
    if (req.path.startsWith('/api/') && !['GET', 'HEAD'].includes(req.method)) res.on('finish', () => {
      recordAudit({ requestId, method: req.method, route: typeof req.route?.path === 'string' ? req.route.path : '/api/unknown', status: res.statusCode });
    });
    if (!hosts.has((req.headers.host || '').toLowerCase())) return res.status(403).json({ error: 'Host não autorizado. Use 127.0.0.1 ou localhost.' });
    if (req.headers['sec-fetch-site'] === 'cross-site' || (req.headers.origin && !origins.has(req.headers.origin))) return res.status(403).json({ error: 'Origem não autorizada.' });
    if (!req.path.startsWith('/api/')) return next();
    const now = Date.now();
    for (const [key, value] of buckets) if (now - value.at > 60_000) buckets.delete(key);
    const key = req.socket.remoteAddress;
    const bucket = buckets.get(key) || { at: now, count: 0 };
    buckets.set(key, bucket);
    if (++bucket.count > 240) return res.set('Retry-After', '60').status(429).json({ error: 'Muitas solicitações. Aguarde um minuto.' });
    for (const [id, value] of sessions) if (value.expires < now) sessions.delete(id);
    const id = (req.headers.cookie || '').split(';').map(x => x.trim()).find(x => x.startsWith('maven_session='))?.slice(14);
    req.localSession = sessions.get(id);
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
    if (!req.is('application/json')) return res.status(415).json({ error: 'Envie application/json.' });
    const token = req.headers['x-csrf-token'];
    if (!req.localSession || typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token) || !crypto.timingSafeEqual(Buffer.from(token), Buffer.from(req.localSession.token))) return res.status(403).json({ error: 'Sessão local expirada. Atualize o painel.', code: 'SESSION_EXPIRED' });
    next();
  });
  app.get('/api/session', (req, res) => {
    if (req.localSession) return res.json({ token: req.localSession.token });
    if (sessions.size >= 100) sessions.delete(sessions.keys().next().value);
    const id = crypto.randomBytes(32).toString('hex');
    const value = { token: crypto.randomBytes(32).toString('hex'), expires: Date.now() + ttl };
    sessions.set(id, value);
    res.setHeader('Set-Cookie', `maven_session=${id}; HttpOnly; SameSite=Strict; Path=/api; Max-Age=${ttl / 1000}`);
    res.json({ token: value.token });
  });
}
