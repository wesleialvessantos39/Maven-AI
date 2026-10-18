import { build } from 'esbuild';
import fs from 'node:fs/promises';
import path from 'node:path';
import { root } from './panel-state.mjs';
const directory = path.join(root, 'server/vendor');
await fs.mkdir(directory, { recursive: true });
await build({
  entryPoints: [path.join(root, 'third_party/context7/packages/sdk/src/client.ts')],
  outfile: path.join(directory, 'context7-sdk.mjs'),
  tsconfig: path.join(root, 'third_party/context7/packages/sdk/tsconfig.json'),
  bundle: true, platform: 'node', format: 'esm', target: 'node22',
  banner: { js: '// Context7 SDK 0.5.1 — Copyright (c) 2021 Upstash, Inc. MIT.\n// Generated from third_party/context7/packages/sdk/src. See third_party/context7/LICENSE.' }
});
console.log('SDK oficial Context7 compilado a partir do repositório enviado.');
