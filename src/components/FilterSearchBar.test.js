import { createRef, useState } from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FilterSearchBar from './FilterSearchBar';

const Harness = () => {
  const [value, setValue] = useState('');
  return (
    <>
      <FilterSearchBar label="Buscar en Provincia" value={value} onChange={(e) => setValue(e.target.value)} />
      <button onClick={() => setValue('')}>vaciar</button>
    </>
  );
};

describe('FilterSearchBar', () => {
  it('muestra el valor que recibe del padre y se vacía cuando el padre lo vacía', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const input = screen.getByLabelText('Buscar en Provincia');

    await user.type(input, 'Mál');
    expect(input).toHaveValue('Mál');

    await user.click(screen.getByText('vaciar'));
    expect(input).toHaveValue('');
  });

  it('la etiqueta es visible y está asociada al campo', () => {
    render(<Harness />);
    const input = screen.getByLabelText('Buscar en Provincia');
    const etiqueta = screen.getByText('Buscar en Provincia');

    expect(etiqueta.tagName).toBe('LABEL');
    expect(etiqueta).not.toHaveClass('sr-only');
    expect(etiqueta).toHaveAttribute('for', input.id);
  });

  it('dos buscadores tienen id distintos', () => {
    render(
      <>
        <FilterSearchBar label="Provincia" value="" onChange={() => {}} />
        <FilterSearchBar label="Municipio" value="" onChange={() => {}} />
      </>
    );

    const ids = [screen.getByLabelText('Provincia').id, screen.getByLabelText('Municipio').id];
    expect(ids[0]).not.toBe(ids[1]);
    expect(ids).not.toContain('buscar');
  });

  it('el campo lleva el anillo interior de foco y no lleva clases de foco inertes', () => {
    render(<Harness />);
    const input = screen.getByLabelText('Buscar en Provincia');

    expect(input).toHaveClass('focus-ring-inset');
    expect(input.className).not.toMatch(/focus:(outline|ring)/);
  });

  it('el campo redondea sus esquinas y deja sitio al icono', () => {
    render(<Harness />);
    const input = screen.getByLabelText('Buscar en Provincia');

    expect(input).toHaveClass('rounded-xl', 'pl-10');
  });

  it('el icono de lupa está oculto a los lectores', () => {
    const { container } = render(<Harness />);

    expect(container.querySelector('svg').closest('[aria-hidden="true"]')).toBeInTheDocument();
  });

  it('usa los tokens: borde brand-dark, placeholder moss y ningún hexadecimal', () => {
    render(<FilterSearchBar label="Provincia" placeholderText="Ej." value="" onChange={() => {}} />);
    const input = screen.getByLabelText('Provincia');

    expect(input).toHaveClass('h-12', 'border-brand-dark', 'placeholder:text-moss');
    expect(input.className).not.toMatch(/#99BBA8/i);
  });

  it('aria-invalid y aria-describedby solo aparecen cuando se pasan, e inputRef apunta al input', () => {
    const ref = createRef();
    const { rerender } = render(<FilterSearchBar label="Provincia" value="" onChange={() => {}} inputRef={ref} />);
    const input = screen.getByLabelText('Provincia');

    expect(ref.current).toBe(input);
    expect(input).not.toHaveAttribute('aria-invalid');
    expect(input).not.toHaveAttribute('aria-describedby');

    rerender(<FilterSearchBar label="Provincia" value="" onChange={() => {}} invalid describedBy="e" />);
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby', 'e');
  });
});
