import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import EmailContactGrid from './EmailContactGrid';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => (key === 'home.emailsData' ? 'Ana Ruiz/ana@uma.es/Luis Gil/luis@uma.es' : key),
    i18n: { language: 'es', changeLanguage: vi.fn() },
  }),
  Trans: ({ i18nKey }) => i18nKey,
  initReactI18next: { type: '3rdParty', init: () => {} },
}));

describe('EmailContactGrid', () => {
  it('una columna y dos desde sm, con texto de 16 px', () => {
    const { container } = render(<EmailContactGrid />);

    expect(container.firstChild).toHaveClass('grid', 'grid-cols-1', 'sm:grid-cols-2', 'text-base');
    expect(container.firstChild).not.toHaveClass('grid-cols-2', 'text-sm');
  });

  it('cada correo es un enlace mailto de 44 px, subrayado y que parte la línea', () => {
    render(<EmailContactGrid />);

    const link = screen.getByRole('link', { name: 'ana@uma.es' });
    expect(link).toHaveAttribute('href', 'mailto:ana@uma.es');
    expect(link).toHaveClass('inline-flex', 'min-h-11', 'items-center', 'break-all', 'text-moss', 'underline');
    expect(link).not.toHaveClass('italic');
  });

  it('el nombre va en negrita (700) y sin hex', () => {
    const { container } = render(<EmailContactGrid />);

    const nombre = screen.getByText('Luis Gil');
    expect(nombre).toHaveClass('font-bold', 'text-ink');
    expect(container.innerHTML).not.toMatch(/font-semibold|\[#/);
  });
});
