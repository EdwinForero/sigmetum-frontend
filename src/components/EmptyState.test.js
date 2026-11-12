import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import EmptyState from './EmptyState';

describe('EmptyState', () => {
  it('pinta el título como h2, la causa como párrafo y la acción', () => {
    render(
      <EmptyState title="Sin datos" action={<button type="button">Reintentar</button>}>
        Causa del vacío.
      </EmptyState>
    );

    expect(screen.getByRole('heading', { level: 2, name: 'Sin datos' })).toBeInTheDocument();
    expect(screen.getByText('Causa del vacío.').tagName).toBe('P');
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
  });

  it('sin acción no pinta hueco de acción', () => {
    const { container } = render(<EmptyState title="Sin datos">Causa.</EmptyState>);

    expect(container.querySelector('button')).toBeNull();
    expect(container.firstChild.children).toHaveLength(2);
  });

  it('con role="alert" el bloque es un aviso; sin role no tiene rol', () => {
    const { rerender } = render(<EmptyState title="Fallo" role="alert">Causa.</EmptyState>);
    expect(screen.getByRole('alert')).toHaveTextContent('Fallo');

    rerender(<EmptyState title="Vacío">Causa.</EmptyState>);
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('solo admite role="alert": cualquier otro valor se ignora', () => {
    render(<EmptyState title="Vacío" role="status">Causa.</EmptyState>);

    expect(screen.queryByRole('status')).toBeNull();
  });

  it('usa la jerarquía del sistema de diseño: título xl en negrita brand-deep y frase base ink-soft', () => {
    const { container } = render(<EmptyState title="Sin datos">Causa.</EmptyState>);

    expect(container.firstChild).toHaveClass('max-w-prose', 'mt-stack-lg');
    expect(screen.getByRole('heading', { level: 2 })).toHaveClass('text-xl', 'font-bold', 'text-brand-deep');
    expect(screen.getByText('Causa.')).toHaveClass('text-base', 'text-ink-soft');
    expect(container.innerHTML).not.toMatch(/#[0-9A-Fa-f]{3,8}\b|(gray|blue|red|green|yellow)-\d/);
  });
});
