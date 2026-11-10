import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import InfoButton from './InfoButton';

describe('InfoButton', () => {
  it('tiene nombre accesible genérico, anillo de foco y la ligadura oculta', () => {
    render(<InfoButton tooltipText="Ayuda" />);

    const boton = screen.getByRole('button', { name: 'iconButton.info' });
    expect(boton).toHaveClass('focus-ring');
    expect(boton.className).not.toMatch(/focus:outline/);
    expect(boton.querySelector('span')).toHaveAttribute('aria-hidden', 'true');
  });
});
