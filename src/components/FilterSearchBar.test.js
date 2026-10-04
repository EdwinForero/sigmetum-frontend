import { useState } from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FilterSearchBar from './FilterSearchBar';

const Harness = () => {
  const [value, setValue] = useState('');
  return (
    <>
      <FilterSearchBar placeholderText="Provincia" value={value} onChange={(e) => setValue(e.target.value)} />
      <button onClick={() => setValue('')}>vaciar</button>
    </>
  );
};

describe('FilterSearchBar', () => {
  it('muestra el valor que recibe del padre y se vacía cuando el padre lo vacía', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const input = screen.getByPlaceholderText('Provincia');

    await user.type(input, 'Mál');
    expect(input).toHaveValue('Mál');

    await user.click(screen.getByText('vaciar'));
    expect(input).toHaveValue('');
  });
});
