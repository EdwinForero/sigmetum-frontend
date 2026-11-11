import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import Table from './Table';

describe('Table', () => {
  it('muestra la unión de claves de todas las filas', () => {
    render(<Table data={[{ a: 1 }, { a: 2, b: 3 }]} />);

    expect(screen.getByText('attributes.a')).toBeInTheDocument();
    expect(screen.getByText('attributes.b')).toBeInTheDocument();
  });

  it('ordena las columnas por primera aparición', () => {
    render(<Table data={[{ b: 1 }, { a: 2, b: 3 }]} />);

    const headers = screen.getAllByRole('columnheader').map((h) => h.textContent);
    expect(headers).toEqual(['attributes.b', 'attributes.a']);
  });

  it('no muta data', () => {
    const data = [{ a: 1 }, { a: 2, b: 3 }];
    const copia = JSON.parse(JSON.stringify(data));
    render(<Table data={data} />);

    expect(data).toEqual(copia);
  });

  it('la tabla va en una región con nombre y alcanzable con teclado, con la paginación fuera', () => {
    render(<Table data={[{ a: 1 }]} label="Datos de la versión" />);

    const region = screen.getByRole('region', { name: 'Datos de la versión' });
    expect(region).toHaveAttribute('tabindex', '0');
    expect(region).toHaveClass('overflow-x-auto', 'focus-ring');
    expect(within(region).getByRole('table')).toBeInTheDocument();
    expect(within(region).queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'iconButton.nextPage' })).toBeInTheDocument();
  });

  it('cada th es una cabecera de columna con scope y la tabla tiene un caption accesible', () => {
    render(<Table data={[{ a: 1, b: 2 }]} label="Datos de la versión" />);

    screen.getAllByRole('columnheader').forEach((th) => {
      expect(th).toHaveAttribute('scope', 'col');
      expect(th).toHaveClass('text-ink');
    });
    expect(screen.getByRole('table', { name: 'Datos de la versión' })).toBeInTheDocument();
    expect(screen.getByText('Datos de la versión', { selector: 'caption' })).toHaveClass('sr-only');
  });
});
