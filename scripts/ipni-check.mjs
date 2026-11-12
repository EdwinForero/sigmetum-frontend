// Comprobación manual de las variantes de consulta a IPNI (BL4). No forma parte de CI ni de package.json.
//
//   node scripts/ipni-check.mjs --api <base hasta /api/v1> [--sample 20] [--out <ruta.json>]
//
// Obtiene los nombres con GET <base>/get-merged-data, toma una muestra y mide cada variante contra la API
// JSON de IPNI (https://www.ipni.org/api/1/search?q=...), a una consulta por segundo. Solo se envía el nombre
// de la especie. Sale con código 2 si fallan los controles (positivo `Quercus ilex`, negativo `Zzzxq qqqzx`).
// Sin contrato documentado de la API de IPNI (por confirmar): puede cambiar sin aviso.
import { writeFileSync } from 'node:fs';
import { ipniQuery } from '../src/utilities/ipniUrl.js';
import {
  buildGenusMap,
  classifyResult,
  expandGenus,
  flattenSpecies,
  sampleNames,
} from '../src/utilities/ipniCheck.js';

const IPNI_API = 'https://www.ipni.org/api/1/search?q=';
const DELAY_MS = 1000;
const TIMEOUT_MS = 15000;

const args = process.argv.slice(2);
const option = (name) => {
  const index = args.indexOf(`--${name}`);
  return index === -1 ? undefined : args[index + 1];
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchJson = async (url) => {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'ipni-check/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
};

let lastRequest = 0;
const queryIpni = async (searched, query) => {
  const wait = lastRequest + DELAY_MS - Date.now();
  if (wait > 0) await sleep(wait);
  lastRequest = Date.now();
  try {
    return classifyResult(searched, await fetchJson(IPNI_API + encodeURIComponent(query)));
  } catch {
    return { status: 'unknown', total: 0 };
  }
};

const main = async () => {
  const api = option('api');
  if (!api) {
    console.error('Uso: node scripts/ipni-check.mjs --api <base hasta /api/v1> [--sample 20] [--out <ruta>]');
    return 1;
  }
  const size = Number.parseInt(option('sample') ?? '20', 10);
  if (!Number.isInteger(size) || size < 1) {
    console.error('--sample debe ser un entero positivo.');
    return 1;
  }

  const positive = await queryIpni('Quercus ilex', 'Quercus ilex');
  const negative = await queryIpni('Zzzxq qqqzx', 'Zzzxq qqqzx');
  if (positive.total <= 0 || negative.status !== 'zero') {
    console.error(
      `Controles fallidos: "Quercus ilex" dio ${positive.status}/${positive.total} (se espera > 0) y ` +
        `"Zzzxq qqqzx" dio ${negative.status}/${negative.total} (se espera 0). La API de IPNI pudo cambiar.`,
    );
    return 2;
  }

  let body;
  try {
    body = await fetchJson(`${api.replace(/\/+$/, '')}/get-merged-data`);
  } catch (error) {
    console.error(`No se pudo leer ${api}/get-merged-data: ${error.message}`);
    return 1;
  }
  let names;
  try {
    if (!body || body.success !== true) throw new Error('la respuesta no tiene `success: true`');
    names = flattenSpecies(body.data);
  } catch (error) {
    console.error(`La respuesta de get-merged-data tiene otra forma de la esperada: ${error.message}`);
    return 1;
  }
  if (names.length === 0) {
    console.error('No hay nombres en "Especies Características".');
    return 1;
  }

  const genusMap = buildGenusMap(names);
  const sample = sampleNames(names, size);
  const variants = {
    asIs: (name) => ipniQuery(name, 'asIs'),
    noAuthor: (name) => ipniQuery(name, 'noAuthor'),
    binomial: (name) => ipniQuery(name, 'binomial'),
    expandedGenus: (name) => ipniQuery(expandGenus(name, genusMap), 'noAuthor'),
  };

  const summary = {};
  const details = {};
  for (const [variant, build] of Object.entries(variants)) {
    summary[variant] = { exact: 0, approx: 0, zero: 0, unknown: 0, totalResults: 0 };
    details[variant] = [];
    for (const name of sample) {
      const query = build(name);
      const result = await queryIpni(query, query);
      summary[variant][result.status] += 1;
      summary[variant].totalResults += result.total;
      details[variant].push({ name, query, ...result });
    }
  }

  const report = { date: new Date().toISOString(), sampleSize: sample.length, controls: { positive, negative }, summary };
  console.log(`Fecha: ${report.date} · muestra: ${sample.length} de ${names.length} nombres`);
  console.table(summary);
  if (option('out')) {
    writeFileSync(option('out'), `${JSON.stringify({ ...report, sample, details }, null, 2)}\n`);
    console.log(`Detalle escrito en ${option('out')}`);
  }
  return 0;
};

process.exitCode = await main();
