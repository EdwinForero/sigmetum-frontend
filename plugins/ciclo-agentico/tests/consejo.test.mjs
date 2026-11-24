import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (...partes) => readFileSync(join(raiz, ...partes), 'utf8').replace(/\r\n/g, '\n');

test('la skill llm-council existe, con nombre y sección de uso en /ciclo', () => {
  assert.ok(existsSync(join(raiz, 'skills', 'llm-council', 'SKILL.md')), 'falta skills/llm-council/SKILL.md');
  const texto = leer('skills', 'llm-council', 'SKILL.md');
  assert.match(texto, /^---\n\s*name: llm-council/m);
  assert.ok(texto.includes('## uso dentro de /ciclo'), 'falta la sección de uso dentro de /ciclo');
  assert.ok(texto.includes('por confirmar antes de redistribuir'), 'falta la nota de licencia');
});

test('la descripción de llm-council solo la activa bajo petición', () => {
  const cabecera = leer('skills', 'llm-council', 'SKILL.md').split('\n---\n')[0];
  const descripcion = cabecera.split('\n').find((l) => l.startsWith('description:'));
  assert.ok(descripcion, 'falta description');
  assert.ok(!descripcion.includes('STRONG TRIGGERS'), 'la descripción conserva disparadores automáticos');
  assert.ok(descripcion.includes('ONLY use when the user explicitly asks'), 'la descripción no limita la activación');
});

test('/ciclo nombra las skills opcionales con el prefijo del plugin', () => {
  const texto = leer('commands', 'ciclo.md');
  assert.ok(texto.includes('`ciclo-agentico:llm-council`'), 'Consejo sin prefijo');
  assert.ok(texto.includes('`ciclo-agentico:ub-mode`'), 'Modo ub sin prefijo');
});

test('/ciclo ofrece el consejo solo bajo petición y no lo hace bloqueante', () => {
  const texto = leer('commands', 'ciclo.md');
  const regla = texto.split('\n').find((l) => l.startsWith('- **Consejo**'));
  assert.ok(regla, 'falta la regla Consejo');
  for (const pieza of ['llm-council', 'solo bajo petición', 'Nunca la lanzas por tu cuenta', 'nunca bloquea ni aprueba']) {
    assert.ok(regla.includes(pieza), `la regla Consejo no dice: ${pieza}`);
  }
  assert.ok(texto.includes('ofrece el Consejo con `AskUserQuestion`'), 'el paso 2 no ofrece el consejo');
});

test('ningún rol precarga llm-council', () => {
  for (const rol of ['requirements', 'architect', 'developer', 'tester-documentador']) {
    assert.ok(!leer('agents', `${rol}.md`).includes('llm-council'), `${rol} menciona llm-council`);
  }
});
