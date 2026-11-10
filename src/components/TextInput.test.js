import { useState } from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TextInput from './TextInput';

const Harness = () => {
  const [value, setValue] = useState('');
  return (
    <>
      <TextInput placeholderText="Nuevo término" value={value} onChange={(e) => setValue(e.target.value)} />
      <button onClick={() => setValue('')}>vaciar</button>
    </>
  );
};

describe('TextInput', () => {
  it('muestra el valor que recibe del padre y se vacía cuando el padre lo vacía', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const input = screen.getByPlaceholderText('Nuevo término');

    await user.type(input, 'subsp.');
    expect(input).toHaveValue('subsp.');

    await user.click(screen.getByText('vaciar'));
    expect(input).toHaveValue('');
  });

  it('el campo lleva el anillo interior de foco y la etiqueta no lleva clases de foco inertes', () => {
    render(<Harness />);
    const input = screen.getByPlaceholderText('Nuevo término');

    expect(input).toHaveClass('focus-ring-inset');
    expect(input.className).not.toMatch(/focus:(outline|ring)/);
    expect(input.closest('label').className).not.toMatch(/focus:(outline|ring)/);
  });

  it('el campo redondea sus esquinas para que el anillo interior no las pierda', () => {
    render(<Harness />);

    expect(screen.getByPlaceholderText('Nuevo término')).toHaveClass('rounded-xl');
  });
});
