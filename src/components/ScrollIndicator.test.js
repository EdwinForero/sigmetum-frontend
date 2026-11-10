import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ScrollIndicator from './ScrollIndicator';

describe('ScrollIndicator', () => {
  it('el botón tiene nombre accesible, anillo de foco y la ligadura oculta', () => {
    render(<ScrollIndicator />);

    const boton = screen.getByRole('button', { name: 'iconButton.scrollDown' });
    expect(boton).toHaveClass('focus-ring');
    expect(boton.querySelector('span')).toHaveAttribute('aria-hidden', 'true');
  });
});
