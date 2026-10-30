import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
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
});
