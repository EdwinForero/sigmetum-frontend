import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const { changeLanguage, state } = vi.hoisted(() => ({
  changeLanguage: vi.fn(),
  state: { resolvedLanguage: 'es' },
}));

// El mock global crea un vi.fn() nuevo en cada llamada: aquí se necesita uno estable.
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: { resolvedLanguage: state.resolvedLanguage, language: 'es-ES', changeLanguage },
  }),
}));

import LanguageSwitcher from './LanguageSwitcher';

describe('LanguageSwitcher', () => {
  beforeEach(() => {
    changeLanguage.mockClear();
    state.resolvedLanguage = 'es';
  });

  it('es un selector nativo con nombre accesible y 44 px de alto', () => {
    render(<LanguageSwitcher />);
    const selector = screen.getByRole('combobox', { name: 'language.label' });

    expect(selector).toHaveClass('h-11', 'focus-ring');
  });

  it('es más ligero: borde de 1 px, peso normal, esquinas xl y relleno compacto', () => {
    render(<LanguageSwitcher />);
    const selector = screen.getByRole('combobox', { name: 'language.label' });

    expect(selector).toHaveClass('border', 'font-normal', 'rounded-xl', 'pl-2', 'pr-1');
    expect(selector).not.toHaveClass('border-2', 'font-bold', 'rounded-lg', 'px-2');
  });

  it('cada opción declara su idioma con lang', () => {
    render(<LanguageSwitcher />);

    const espanol = screen.getByRole('option', { name: 'language.spanish' });
    const ingles = screen.getByRole('option', { name: 'language.english' });
    expect(espanol).toHaveAttribute('lang', 'es');
    expect(ingles).toHaveAttribute('lang', 'en');
  });

  it('elegir English llama a changeLanguage con en', async () => {
    const user = userEvent.setup();
    render(<LanguageSwitcher />);

    await user.selectOptions(screen.getByRole('combobox', { name: 'language.label' }), 'en');

    expect(changeLanguage).toHaveBeenCalledTimes(1);
    expect(changeLanguage).toHaveBeenCalledWith('en');
  });

  it('el valor sale de resolvedLanguage', () => {
    state.resolvedLanguage = 'en';
    render(<LanguageSwitcher />);

    expect(screen.getByRole('combobox', { name: 'language.label' })).toHaveValue('en');
  });

  it('un idioma no soportado se muestra como español', () => {
    state.resolvedLanguage = 'fr';
    render(<LanguageSwitcher />);

    expect(screen.getByRole('combobox', { name: 'language.label' })).toHaveValue('es');
  });
});
