import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as XLSX from 'xlsx';
import { downloadXLSX } from './CSVfunctions';

describe('downloadXLSX', () => {
  let exportedBlob;

  beforeEach(() => {
    exportedBlob = null;
    URL.createObjectURL = vi.fn((blob) => {
      exportedBlob = blob;
      return 'blob:test';
    });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const buildRows = () => [
    { Provincia: 'Málaga', 'Especies Características': ['Quercus suber', 'Pistacia lentiscus'] },
    { Provincia: 'Jaén', 'Especies Características': ['Quercus ilex'] },
  ];

  it('no modifica los datos originales que usan los filtros y el listado', () => {
    const rows = buildRows();

    downloadXLSX(rows);

    expect(rows).toEqual(buildRows());
    expect(Array.isArray(rows[0]['Especies Características'])).toBe(true);
  });

  it('exporta los valores de tipo array como texto separado por comas', async () => {
    downloadXLSX(buildRows());

    const buffer = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsArrayBuffer(exportedBlob);
    });
    const workbook = XLSX.read(buffer);
    const sheet = XLSX.utils.sheet_to_json(workbook.Sheets['Sigmetum-A']);

    expect(sheet[0]['Especies Características']).toBe('Quercus suber, Pistacia lentiscus');
    expect(sheet[1]['Especies Características']).toBe('Quercus ilex');
  });
});
