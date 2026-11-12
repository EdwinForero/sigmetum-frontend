import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Aquí sí se usa i18next de verdad: el resumen de errores depende del plural (`_one` / `_other`) y del texto real.
vi.unmock('react-i18next');
vi.mock('../services/api', () => ({ default: { post: vi.fn() } }));

import ContactForm from './ContactForm';
import ToastProvider from './ToastProvider';
import i18n from '../i18n';
import es from '../languages/es/translation.json';

const summary = () => document.querySelector('form [role=status]');

const renderForm = () =>
  render(
    <ToastProvider>
      <ContactForm onLoad={vi.fn()} />
    </ToastProvider>
  );

describe('ContactForm con i18n real', () => {
  beforeAll(async () => {
    await i18n.changeLanguage('es');
  });

  it('con cuatro campos inválidos el resumen dice el texto real de errorSummary_other', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole('button', { name: es.home.contactForm.sendButton }));

    expect(summary()).toHaveTextContent(es.home.contactForm.errorSummary_other.replace('{{count}}', '4'));
    expect(summary()).toHaveTextContent('Hay 4 errores en el formulario.');
  });

  it('con un solo campo inválido el resumen dice el texto real de errorSummary_one', async () => {
    const user = userEvent.setup();
    renderForm();
    await user.type(screen.getByLabelText(es.home.contactForm.nameLabel), 'Ana');
    await user.type(screen.getByLabelText(es.home.contactForm.emailLabel), 'ana@example.com');
    await user.type(screen.getByLabelText(es.home.contactForm.subjectLabel), 'Hola');

    await user.click(screen.getByRole('button', { name: es.home.contactForm.sendButton }));

    expect(summary()).toHaveTextContent(es.home.contactForm.errorSummary_one.replace('{{count}}', '1'));
    expect(summary()).toHaveTextContent('Hay 1 error en el formulario.');
  });
});
