import { defineConfig } from 'vite';
import fs from 'node:fs';
import { fingerprint } from '../scripts/panel-state.mjs';
export default defineConfig({
  esbuild: { jsx: 'automatic' },
  plugins: [{ name: 'panel-fingerprint', apply: 'build', closeBundle() { fs.writeFileSync(new URL('./dist/build-meta.json', import.meta.url), JSON.stringify({ version: '2.0.0', fingerprint: fingerprint() })); } }],
  server: {
    host: '127.0.0.1', port: 5173, strictPort: true,
    proxy: { '/api': 'http://127.0.0.1:8787' }
  }
});
