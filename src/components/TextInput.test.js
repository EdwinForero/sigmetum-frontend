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
});
