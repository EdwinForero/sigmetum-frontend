import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import SpeciesAttribute from './SpeciesAttribute';

describe('SpeciesAttribute', () => {
  it('los valores en cursiva siguen en Amaranth (font-primary italic): Sen no tiene cursiva', () => {
    render(<SpeciesAttribute title="Provincia" description="Málaga, Almería" />);

    expect(screen.getByText('Málaga')).toHaveClass('font-primary', 'italic');
    expect(screen.getByText('Almería')).toHaveClass('font-primary', 'italic');
  });

  it('un valor que no es texto usa el mismo estilo', () => {
    const { container } = render(<SpeciesAttribute title="Altitud" description={undefined} />);

    expect(container.querySelector('p')).toHaveClass('font-primary', 'italic');
  });
});
