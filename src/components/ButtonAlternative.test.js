import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ButtonAlternative from './ButtonAlternative';

describe('ButtonAlternative', () => {
  it('lleva el anillo de foco', () => {
    render(<ButtonAlternative text="Elegir" />);

    expect(screen.getByRole('button', { name: 'Elegir' })).toHaveClass('focus-ring');
  });

  it('los chevrons del desplegable no entran en el nombre accesible', () => {
    render(<ButtonAlternative text="Elegir" dropdownOptions={['a', 'b']} />);

    expect(screen.getByRole('button', { name: 'Elegir' })).toBeInTheDocument();
  });
});
