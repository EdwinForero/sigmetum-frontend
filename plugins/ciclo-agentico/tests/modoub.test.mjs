import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (...partes) => readFileSync(join(raiz, ...partes), 'utf8').replace(/\r\n/g, '\n');

test('la skill ub-mode existe con su licencia MIT y la sección de uso en /ciclo', () => {
  assert.ok(existsSync(join(raiz, 'skills', 'ub-mode', 'SKILL.md')), 'falta skills/ub-mode/SKILL.md');
  assert.ok(existsSync(join(raiz, 'skills', 'ub-mode', 'LICENSE')), 'falta skills/ub-mode/LICENSE');
  assert.ok(leer('skills', 'ub-mode', 'LICENSE').includes('MIT License'), 'LICENSE no es MIT');
  const texto = leer('skills', 'ub-mode', 'SKILL.md');
  assert.match(texto, /^---\nname: ub-mode/m);
  assert.ok(texto.includes('# Uso dentro de /ciclo'), 'falta la sección de uso dentro de /ciclo');
  assert.ok(texto.includes('Sin commit ni push'), 'falta la anulación de commit y push');
});

test('/ciclo aplica el modo ub solo bajo petición y se lo pasa al developer', () => {
  const texto = leer('commands', 'ciclo.md');
  const regla = texto.split('\n').find((l) => l.startsWith('- **Modo ub**'));
  assert.ok(regla, 'falta la regla Modo ub');
  for (const pieza of ['ub-mode', 'solo bajo petición', 'developer', 'sin commit ni push']) {
    assert.ok(regla.includes(pieza), `la regla Modo ub no dice: ${pieza}`);
  }
  assert.ok(texto.includes('añade la ruta de la skill `ub-mode`'), 'el paso 3 no pasa la skill al developer');
});

test('ningún rol precarga ub-mode', () => {
  for (const rol of ['requirements', 'architect', 'developer', 'tester-documentador']) {
    assert.ok(!leer('agents', `${rol}.md`).includes('ub-mode'), `${rol} menciona ub-mode`);
  }
});
