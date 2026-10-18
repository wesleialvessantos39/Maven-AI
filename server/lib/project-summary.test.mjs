import test from 'node:test';
import assert from 'node:assert/strict';
import { summarizeProject } from './project-summary.mjs';

test('detecta estrutura React + Vite do exemplo local, sem executar projeto', async () => {
  const result = await summarizeProject('exemplo-react-vite');
  assert.equal(result.project, 'exemplo-react-vite');
  assert.ok(result.stack.includes('React'));
  assert.ok(result.stack.includes('Vite'));
  assert.equal(result.packageCount, 1);
});
