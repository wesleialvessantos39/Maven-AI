import crypto from 'node:crypto';
import path from 'node:path';
export const sha = value => crypto.createHash('sha256').update(value).digest('hex');
export const makeId = () => crypto.randomUUID();
export function bad(message, status=400) { return Object.assign(new Error(message), {status}); }
export function requirePhrase(phrase, expected) { if (phrase !== expected) throw bad(`Confirmação inválida. Digite ${expected}.`,403); }
export const allowedCode = name => typeof name === 'string' && name.length < 250 && /\.(?:jsx?|tsx?|css|html|json|sql|md|yml|yaml|[cm]js|py|go|rs|java|cs|php|rb|kt|swift|vue|svelte|toml|txt)$/i.test(name) && !name.includes('\\') && !name.split('/').some(p=>!p || p==='.' || p==='..' || p.startsWith('.')) && !/(?:^|\/)(?:node_modules|dist|build|coverage|secrets?)(?:\/|$)/i.test(name) && !/(?:^|\/)(?:credentials?\.[^/]+|secret[^/]*|package-lock\.json|pnpm-lock\.yaml|yarn\.lock)$/i.test(name);
export function onlySlug(value, name='Nome') { if (typeof value !== 'string' || !/^[a-zA-Z][\w.-]{0,63}$/.test(value) || value === '..') throw bad(`${name} inválido.`); return value; }
export function repoParts(value) { if (typeof value !== 'string' || !/^[a-z\d_.-]+\/[a-z\d_.-]+$/i.test(value) || value.includes('..')) throw bad('Repositório deve ser owner/repo'); return value.split('/'); }
export function comparePath(base, candidate) { return candidate === base || candidate.startsWith(base + path.sep); }
