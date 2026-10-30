import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import DialogSpecies from './DialogSpecies';

const ESPECIE = 'Quercus ilex';

const fila = (provincia, especies) => ({
  'Especies Características': especies,
  Provincia: provincia,
  Municipio: 'Municipio comun',
  'Altitud Media': '100',
  'Sector Biogeográfico': 'Sector comun',
  'Piso Bioclimático': 'Piso comun',
  Ombrotipo: 'Ombrotipo comun',
  'Naturaleza del Sustrato': 'Sustrato comun',
  'Tipo de Serie': 'Serie comun',
  'Serie de Vegetación': 'Vegetacion comun',
  'Vegetación Potencial': 'Potencial comun',
});

const renderDialog = (data) =>
  render(
    <DialogSpecies
      isOpen
      onClose={vi.fn()}
      data={data}
      species={{ 'Especies Características': ESPECIE }}
      noItalicTerms={[]}
    />
  );

describe('DialogSpecies', () => {
  it('cuenta la fila cuya cadena es idéntica a la especie', () => {
    renderDialog([fila('Provincia exacta', ESPECIE)]);

    expect(screen.getByText('Provincia exacta')).toBeInTheDocument();
  });

  it('no cuenta una cadena que solo contiene la especie como subcadena', () => {
    renderDialog([
      fila('Provincia exacta', ESPECIE),
      fila('Provincia subcadena', 'Quercus ilex subsp. ballota'),
    ]);

    expect(screen.getByText('Provincia exacta')).toBeInTheDocument();
    expect(screen.queryByText('Provincia subcadena')).not.toBeInTheDocument();
  });

  it('cuenta un array que contiene la especie junto con otras', () => {
    renderDialog([fila('Provincia array', ['Pinus nigra', ESPECIE])]);

    expect(screen.getByText('Provincia array')).toBeInTheDocument();
  });

  it('no cuenta un array que solo contiene un nombre más largo', () => {
    renderDialog([
      fila('Provincia exacta', ESPECIE),
      fila('Provincia array largo', ['Quercus ilex subsp. ballota']),
    ]);

    expect(screen.getByText('Provincia exacta')).toBeInTheDocument();
    expect(screen.queryByText('Provincia array largo')).not.toBeInTheDocument();
  });

  it('no cuenta undefined, null ni cadena vacía y no lanza error', () => {
    const sinCampo = fila('Provincia sin campo', ESPECIE);
    delete sinCampo['Especies Características'];

    expect(() =>
      renderDialog([
        fila('Provincia exacta', ESPECIE),
        sinCampo,
        fila('Provincia nula', null),
        fila('Provincia vacia', ''),
      ])
    ).not.toThrow();

    expect(screen.getByText('Provincia exacta')).toBeInTheDocument();
    expect(screen.queryByText('Provincia sin campo')).not.toBeInTheDocument();
    expect(screen.queryByText('Provincia nula')).not.toBeInTheDocument();
    expect(screen.queryByText('Provincia vacia')).not.toBeInTheDocument();
  });

  it('no cuenta variantes de mayúsculas ni de espacios', () => {
    renderDialog([
      fila('Provincia exacta', ESPECIE),
      fila('Provincia minuscula', 'quercus ilex'),
      fila('Provincia espacio', 'Quercus ilex '),
    ]);

    expect(screen.getByText('Provincia exacta')).toBeInTheDocument();
    expect(screen.queryByText('Provincia minuscula')).not.toBeInTheDocument();
    expect(screen.queryByText('Provincia espacio')).not.toBeInTheDocument();
  });

  it('no muta data ni species', () => {
    const data = [
      fila('Provincia exacta', ESPECIE),
      fila('Provincia array', ['Pinus nigra', ESPECIE]),
    ];
    const species = { 'Especies Características': ESPECIE };
    const copiaData = JSON.parse(JSON.stringify(data));
    const copiaSpecies = JSON.parse(JSON.stringify(species));

    render(
      <DialogSpecies
        isOpen
        onClose={vi.fn()}
        data={data}
        species={species}
        noItalicTerms={[]}
      />
    );

    expect(data).toEqual(copiaData);
    expect(species).toEqual(copiaSpecies);
  });

  it('mantiene el enlace a IPNI seguro y el botón de cierre', () => {
    renderDialog([fila('Provincia exacta', ESPECIE)]);

    const enlace = screen.getByRole('link');
    expect(enlace).toHaveAttribute('rel', 'noopener noreferrer');
    expect(screen.getByText('explore.dialogSpecies.closeButton')).toBeInTheDocument();
  });
});
