import { createRef, useState } from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TextInput from './TextInput';

const Harness = () => {
  const [value, setValue] = useState('');
  return (
    <>
      <TextInput label="Nuevo término" value={value} onChange={(e) => setValue(e.target.value)} />
      <button onClick={() => setValue('')}>vaciar</button>
    </>
  );
};

describe('TextInput', () => {
  it('muestra el valor que recibe del padre y se vacía cuando el padre lo vacía', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const input = screen.getByLabelText('Nuevo término');

    await user.type(input, 'subsp.');
    expect(input).toHaveValue('subsp.');

    await user.click(screen.getByText('vaciar'));
    expect(input).toHaveValue('');
  });

  it('la etiqueta es visible y está asociada al campo', () => {
    render(<Harness />);
    const input = screen.getByLabelText('Nuevo término');
    const etiqueta = screen.getByText('Nuevo término');

    expect(etiqueta.tagName).toBe('LABEL');
    expect(etiqueta).not.toHaveClass('sr-only');
    expect(etiqueta).toHaveAttribute('for', input.id);
  });

  it('dos campos tienen id distintos', () => {
    render(
      <>
        <TextInput label="Uno" value="" onChange={() => {}} />
        <TextInput label="Dos" value="" onChange={() => {}} />
      </>
    );

    expect(screen.getByLabelText('Uno').id).not.toBe(screen.getByLabelText('Dos').id);
  });

  it('usa el id que recibe', () => {
    render(<TextInput id="mi-campo" label="Uno" value="" onChange={() => {}} />);

    expect(screen.getByLabelText('Uno')).toHaveAttribute('id', 'mi-campo');
  });

  it('el campo lleva el anillo interior de foco y no lleva clases de foco inertes', () => {
    render(<Harness />);
    const input = screen.getByLabelText('Nuevo término');

    expect(input).toHaveClass('focus-ring-inset');
    expect(input.className).not.toMatch(/focus:(outline|ring)/);
  });

  it('el campo redondea sus esquinas para que el anillo interior no las pierda', () => {
    render(<Harness />);

    expect(screen.getByLabelText('Nuevo término')).toHaveClass('rounded-xl');
  });

  it('usa los tokens: borde brand-dark, placeholder moss y ningún hexadecimal', () => {
    render(<TextInput label="Uno" placeholderText="Ej." value="" onChange={() => {}} />);
    const input = screen.getByLabelText('Uno');

    expect(input).toHaveClass('h-12', 'border-brand-dark', 'placeholder:text-moss');
    expect(input.className).not.toMatch(/#99BBA8/i);
    expect(input).toHaveAttribute('placeholder', 'Ej.');
  });

  it('sin placeholderText no pinta placeholder', () => {
    render(<TextInput label="Uno" value="" onChange={() => {}} />);

    expect(screen.getByLabelText('Uno')).not.toHaveAttribute('placeholder');
  });

  it('aria-invalid y aria-describedby solo aparecen cuando se pasan', () => {
    const { rerender } = render(<TextInput label="Uno" value="" onChange={() => {}} />);
    const input = screen.getByLabelText('Uno');

    expect(input).not.toHaveAttribute('aria-invalid');
    expect(input).not.toHaveAttribute('aria-describedby');

    rerender(<TextInput label="Uno" value="" onChange={() => {}} invalid describedBy="error-uno" />);
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby', 'error-uno');
  });

  it('inputRef apunta al input', () => {
    const ref = createRef();
    render(<TextInput label="Uno" value="" onChange={() => {}} inputRef={ref} />);

    expect(ref.current).toBe(screen.getByLabelText('Uno'));
  });
});
