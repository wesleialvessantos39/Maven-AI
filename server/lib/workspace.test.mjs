import test from 'node:test';
import assert from 'node:assert/strict';
import { listProjects, listProjectFiles, readProjectFile } from './workspace.mjs';

test('projeto de demonstração aparece', async () => {
  assert.ok((await listProjects()).includes('exemplo-react-vite'));
});

test('arquivos listados incluem README', async () => {
  assert.ok((await listProjectFiles('exemplo-react-vite')).includes('README.md'));
});

test('lê arquivos de texto aprovados', async () => {
  assert.match((await readProjectFile('exemplo-react-vite', 'README.md')).content, /Projeto demonstrativo/);
});

test('impede atravessar para fora da pasta', async () => {
  await assert.rejects(() => readProjectFile('exemplo-react-vite', '../.env'), /Caminho inválido/);
  await assert.rejects(() => readProjectFile('..', 'README.md'), /inválido/);
});

test('recusa arquivos secretos e extensões não permitidas', async () => {
  await assert.rejects(() => readProjectFile('exemplo-react-vite', '.env'), /protegido/);
  await assert.rejects(() => readProjectFile('exemplo-react-vite', 'imagem.png'), /Tipo de arquivo/);
});
