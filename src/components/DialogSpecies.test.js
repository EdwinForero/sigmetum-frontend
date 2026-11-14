import { useState } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AnimatePresence } from 'motion/react';
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

  it('el enlace a IPNI se nombra solo por su texto, sin la ligadura del icono', () => {
    renderDialog([fila('Provincia exacta', ESPECIE)]);

    expect(screen.getByRole('link', { name: 'explore.dialogSpecies.readMoreLabel' })).toBeInTheDocument();
  });

  it('es un diálogo modal nombrado por el título completo de la especie', () => {
    render(
      <DialogSpecies
        isOpen
        onClose={vi.fn()}
        data={[fila('Provincia exacta', 'Quercus ilex subsp. ballota')]}
        species={{ 'Especies Características': 'Quercus ilex subsp. ballota' }}
        noItalicTerms={['subsp.']}
      />
    );

    const dialogo = screen.getByRole('dialog', { name: /Quercus ilex\s+subsp\.\s+ballota/ });
    expect(dialogo).toHaveAttribute('aria-modal', 'true');
    expect(dialogo).toHaveFocus();
  });

  it('Escape llama a onClose', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <DialogSpecies isOpen onClose={onClose} data={[fila('P', ESPECIE)]} species={{ 'Especies Características': ESPECIE }} noItalicTerms={[]} />
    );

    await user.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('Tab y Shift+Tab quedan atrapados entre el primer atributo y el enlace de IPNI', async () => {
    const user = userEvent.setup();
    render(
      <>
        <button>fuera</button>
        <DialogSpecies isOpen onClose={vi.fn()} data={[fila('P', ESPECIE)]} species={{ 'Especies Características': ESPECIE }} noItalicTerms={[]} />
        <button>fuera después</button>
      </>
    );
    const primero = document.querySelector('summary');
    const enlace = screen.getByRole('link', { name: 'explore.dialogSpecies.readMoreLabel' });

    enlace.focus();
    await user.tab();
    expect(primero).toHaveFocus();

    await user.tab({ shift: true });
    expect(enlace).toHaveFocus();
  });

  it('al cerrar, el foco vuelve al botón que abrió el diálogo', async () => {
    const user = userEvent.setup();
    const Harness = () => {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button onClick={() => setOpen(true)}>abrir</button>
          <DialogSpecies
            isOpen={open}
            onClose={() => setOpen(false)}
            data={[fila('P', ESPECIE)]}
            species={{ 'Especies Características': ESPECIE }}
            noItalicTerms={[]}
          />
        </>
      );
    };
    render(<Harness />);
    const abrir = screen.getByRole('button', { name: 'abrir' });

    await user.click(abrir);
    expect(screen.getByRole('dialog')).toHaveFocus();
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(abrir).toHaveFocus();
  });

  it('al desmontarse dentro de AnimatePresence, el foco vuelve al botón que lo abrió', async () => {
    const user = userEvent.setup();
    const Harness = () => {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button onClick={() => setOpen(true)}>abrir</button>
          <AnimatePresence>
            {open && (
              <DialogSpecies
                isOpen
                onClose={() => setOpen(false)}
                data={[fila('P', ESPECIE)]}
                species={{ 'Especies Características': ESPECIE }}
                noItalicTerms={[]}
              />
            )}
          </AnimatePresence>
        </>
      );
    };
    render(<Harness />);
    const abrir = screen.getByRole('button', { name: 'abrir' });

    await user.click(abrir);
    expect(screen.getByRole('dialog')).toHaveFocus();
    await user.keyboard('{Escape}');

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(abrir).toHaveFocus();
  });

  it('abierto desde una tarjeta no enfocable (foco en body), al cerrar el foco va al main', async () => {
    const user = userEvent.setup();
    const Harness = () => {
      const [open, setOpen] = useState(false);
      return (
        <main>
          <div role="presentation" onClick={() => setOpen(true)}>tarjeta</div>
          <DialogSpecies
            isOpen={open}
            onClose={() => setOpen(false)}
            data={[fila('P', ESPECIE)]}
            species={{ 'Especies Características': ESPECIE }}
            noItalicTerms={[]}
          />
        </main>
      );
    };
    render(<Harness />);

    await user.click(screen.getByText('tarjeta'));
    expect(screen.getByRole('dialog')).toHaveFocus();
    await user.keyboard('{Escape}');

    expect(screen.getByRole('main')).toHaveFocus();
  });

  it('usa tokens: fondo bg-ink/70, caja bg-surface y título text-brand-deep de 24 px, sin hex', () => {
    renderDialog([fila('Provincia exacta', ESPECIE)]);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveClass('bg-surface');
    expect(dialog.parentElement).toHaveClass('bg-ink/70');
    expect(document.getElementById(dialog.getAttribute('aria-labelledby'))).toHaveClass('text-brand-deep', 'text-2xl');
    const propias = [dialog.parentElement.className, dialog.className, dialog.querySelector('a').className].join(' ');
    expect(propias).not.toMatch(/\[#[0-9A-Fa-f]{3,8}\]|gray-\d/);
  });

  it('el enlace de IPNI mide al menos 44 px, es moss y subrayado, y se abre de forma segura', () => {
    renderDialog([fila('Provincia exacta', ESPECIE)]);

    const link = screen.getByRole('link', { name: /explore.dialogSpecies.readMoreLabel/ });
    expect(link).toHaveClass('inline-flex', 'min-h-11', 'items-center', 'text-moss', 'underline');
    expect(link).not.toHaveClass('text-sm');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(link.getAttribute('href')).toMatch(/^https:\/\/www\.ipni\.org\/search\?q=/);
  });

  it('el enlace de IPNI consulta el nombre sin autor', () => {
    render(
      <DialogSpecies
        isOpen
        onClose={vi.fn()}
        data={[fila('Provincia exacta', 'Pinus pinea L.')]}
        species={{ 'Especies Características': 'Pinus pinea L.' }}
        noItalicTerms={[]}
      />
    );

    expect(screen.getByRole('link').getAttribute('href')).toBe('https://www.ipni.org/search?q=Pinus%20pinea');
  });

  it('con el nombre vacío no hay enlace a IPNI', () => {
    render(
      <DialogSpecies
        isOpen
        onClose={vi.fn()}
        data={[fila('Provincia exacta', '')]}
        species={{ 'Especies Características': '' }}
        noItalicTerms={[]}
      />
    );

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'explore.dialogSpecies.closeButton' })).toBeInTheDocument();
  });

  it('el nombre científico en cursiva sigue en Amaranth (font-primary italic): Sen no tiene cursiva', () => {
    renderDialog([fila('Provincia exacta', ESPECIE)]);

    const nombre = screen.getByRole('heading', { level: 2, name: ESPECIE });
    expect(nombre).toHaveClass('font-primary', 'italic');
  });
});
