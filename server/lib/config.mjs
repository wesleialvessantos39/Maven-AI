// Carrega o .env da raiz, sem depender da pasta atual do terminal.
import { fileURLToPath } from 'node:url';
const file = fileURLToPath(new URL('../../.env', import.meta.url));
try { process.loadEnvFile(file); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
