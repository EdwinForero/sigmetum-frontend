import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ContactForm from './ContactForm';
import ToastProvider from './ToastProvider';
import api from '../services/api';
import es from '../languages/es/translation.json';
import en from '../languages/en/translation.json';

// Solo el resumen de errores interpola: así se comprueba el número sin depender del idioma.
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, opts) => (key === 'home.contactForm.errorSummary' ? `${key}:${opts.count}` : key),
    i18n: { language: 'es', changeLanguage: vi.fn() },
  }),
}));
vi.mock('../services/api', () => ({ default: { post: vi.fn() } }));

const httpError = (status) => Object.assign(new Error(`http_${status}`), { type: 'http', status });

const NAME = 'home.contactForm.nameLabel';
const EMAIL = 'home.contactForm.emailLabel';
const SUBJECT = 'home.contactForm.subjectLabel';
const MESSAGE = 'home.contactForm.messageLabel';
const SEND = 'home.contactForm.sendButton';
const LONG_MESSAGE = 'Un mensaje con más de veinte caracteres.';

const renderForm = () =>
  render(
    <ToastProvider>
      <ContactForm onLoad={vi.fn()} />
    </ToastProvider>
  );

// El ToastProvider monta una región role=alert vacía: los avisos del formulario son los que están dentro del <form>.
const formAlerts = () => [...document.querySelectorAll('form [role=alert]')];
// Todos los errores de campo pintados (con o sin rol), por su id `-error`.
const fieldErrors = () => [...document.querySelectorAll('form [id$="-error"]')];
const summary = () => document.querySelector('form [role=status]');

const fill = async (user) => {
  await user.type(screen.getByLabelText(NAME), 'Ana');
  await user.type(screen.getByLabelText(EMAIL), 'ana@example.com');
  await user.type(screen.getByLabelText(SUBJECT), 'Hola');
  await user.type(screen.getByLabelText(MESSAGE), LONG_MESSAGE);
};

const fillAndSend = async (user) => {
  await fill(user);
  await user.click(screen.getByText(SEND));
};

describe('ContactForm', () => {
  beforeEach(() => {
    api.post.mockReset();
  });

  it('limita la longitud de los cuatro campos', () => {
    renderForm();

    expect(screen.getByLabelText(NAME)).toHaveAttribute('maxLength', '100');
    expect(screen.getByLabelText(EMAIL)).toHaveAttribute('maxLength', '254');
    expect(screen.getByLabelText(SUBJECT)).toHaveAttribute('maxLength', '150');
    expect(screen.getByLabelText(MESSAGE)).toHaveAttribute('maxLength', '2000');
  });

  it.each([
    [429, 'dialogAdvice.errorEmailRateLimit'],
    [400, 'dialogAdvice.errorEmailInvalid'],
    [500, 'dialogAdvice.errorEmailMessage'],
  ])('con un %i muestra %s', async (status, key) => {
    api.post.mockRejectedValue(httpError(status));
    const user = userEvent.setup();
    renderForm();

    await fillAndSend(user);

    const aviso = await screen.findByText(key);
    expect(aviso.closest('[role=alert]')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(aviso.closest('form')).toBeInTheDocument();
  });

  it('el error en línea queda encima de Enviar y se limpia al volver a enviar', async () => {
    api.post.mockRejectedValueOnce(httpError(500)).mockResolvedValueOnce({});
    const user = userEvent.setup();
    renderForm();

    await fillAndSend(user);
    const aviso = await screen.findByText('dialogAdvice.errorEmailMessage');
    const enviar = screen.getByText(SEND);
    expect(aviso.compareDocumentPosition(enviar) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    await user.click(enviar);

    await screen.findByText('dialogAdvice.successEmailMessage');
    expect(screen.queryByText('dialogAdvice.errorEmailMessage')).not.toBeInTheDocument();
  });

  it('asocia cada etiqueta con su campo', () => {
    renderForm();

    expect(screen.getByLabelText(NAME)).toHaveAttribute('type', 'text');
    expect(screen.getByLabelText(EMAIL)).toHaveAttribute('type', 'email');
    expect(screen.getByLabelText(SUBJECT)).toHaveAttribute('type', 'text');
    expect(screen.getByLabelText(MESSAGE).tagName).toBe('TEXTAREA');
  });

  it('dos instancias tienen ids distintos en sus campos', () => {
    render(
      <ToastProvider>
        <ContactForm onLoad={vi.fn()} />
        <ContactForm onLoad={vi.fn()} />
      </ToastProvider>
    );

    const ids = [
      ...screen.getAllByLabelText(NAME),
      ...screen.getAllByLabelText(EMAIL),
      ...screen.getAllByLabelText(SUBJECT),
      ...screen.getAllByLabelText(MESSAGE),
    ].map((el) => el.id);
    expect(ids).toHaveLength(8);
    expect(ids.every(Boolean)).toBe(true);
    expect(new Set(ids).size).toBe(8);
  });

  it('el éxito se avisa en la región status y se envía una sola vez', async () => {
    api.post.mockResolvedValue({});
    const user = userEvent.setup();
    renderForm();

    await fillAndSend(user);

    const aviso = await screen.findByText('dialogAdvice.successEmailMessage');
    expect(aviso.closest('[role=status]')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(api.post).toHaveBeenCalledTimes(1);
  });

  it('los cuatro campos llevan el anillo de foco', () => {
    renderForm();

    [NAME, EMAIL, SUBJECT, MESSAGE].forEach((label) => {
      const campo = screen.getByLabelText(label);
      expect(campo).toHaveClass('focus-ring-inset');
      expect(campo.className).not.toMatch(/focus:outline/);
    });
  });

  describe('validación propia', () => {
    it('el formulario no usa la validación nativa y los campos son obligatorios', () => {
      const { container } = renderForm();

      expect(container.querySelector('form')).toHaveAttribute('novalidate');
      [NAME, EMAIL, SUBJECT, MESSAGE].forEach((label) => expect(screen.getByLabelText(label)).toBeRequired());
      expect(screen.getByLabelText(NAME)).toHaveAttribute('autocomplete', 'name');
      expect(screen.getByLabelText(EMAIL)).toHaveAttribute('autocomplete', 'email');
    });

    it('al cargar no hay errores ni campos inválidos', () => {
      renderForm();

      expect(formAlerts()).toHaveLength(0);
      [NAME, EMAIL, SUBJECT, MESSAGE].forEach((label) =>
        expect(screen.getByLabelText(label)).not.toHaveAttribute('aria-invalid')
      );
    });

    it('al salir del correo con «juan.perez» aparece el error enlazado, y al corregirlo desaparece', async () => {
      const user = userEvent.setup();
      renderForm();
      const correo = screen.getByLabelText(EMAIL);

      await user.type(correo, 'juan.perez');
      expect(formAlerts()).toHaveLength(0);
      await user.tab();

      expect(formAlerts()).toHaveLength(1);
      const [alerta] = formAlerts();
      expect(alerta).toHaveTextContent('form.errors.email');
      expect(correo).toHaveAttribute('aria-invalid', 'true');
      expect(correo.getAttribute('aria-describedby').split(' ')).toContain(alerta.id);

      await user.clear(correo);
      await user.type(correo, 'juan.perez@uma.es');

      expect(correo).toHaveValue('juan.perez@uma.es');
      // El campo de asunto perdió el foco al volver al correo y ya cuenta como tocado: su error es otro.
      expect(document.getElementById(alerta.id)).toBeNull();
      expect(correo).not.toHaveAttribute('aria-invalid');
      expect(correo.getAttribute('aria-describedby')).not.toContain('-error');
    });

    it('un mensaje corto tocado muestra form.errors.minLength', async () => {
      const user = userEvent.setup();
      renderForm();

      await user.type(screen.getByLabelText(MESSAGE), 'corto');
      await user.tab();

      expect(formAlerts()).toHaveLength(1);
      expect(formAlerts()[0]).toHaveTextContent('form.errors.minLength');
    });

    it('cada campo enlaza su hint', () => {
      renderForm();

      [
        [NAME, 'home.contactForm.nameHint'],
        [EMAIL, 'home.contactForm.emailHint'],
        [SUBJECT, 'home.contactForm.subjectHint'],
        [MESSAGE, 'home.contactForm.messageHint'],
      ].forEach(([label, hintKey]) => {
        const hint = screen.getByText(hintKey);
        expect(screen.getByLabelText(label).getAttribute('aria-describedby').split(' ')).toContain(hint.id);
      });
      expect(screen.getByText('home.contactForm.allRequired')).toBeInTheDocument();
    });

    it('Enter con el formulario vacío pinta cuatro errores sin rol, un único resumen status, el foco al nombre y no envía', async () => {
      const user = userEvent.setup();
      renderForm();

      await user.click(screen.getByLabelText(SUBJECT));
      await user.keyboard('{Enter}');

      expect(fieldErrors()).toHaveLength(4);
      fieldErrors().forEach((error) => expect(error).toHaveTextContent('form.errors.required'));
      // Un solo anuncio: los errores no son alertas; los lee el foco (aria-describedby) y el resumen cuenta el total.
      expect(formAlerts()).toHaveLength(0);
      expect(document.querySelectorAll('form [role=status]')).toHaveLength(1);
      expect(summary()).toHaveTextContent('home.contactForm.errorSummary:4');
      expect(summary()).toHaveClass('sr-only');
      expect(screen.getByLabelText(NAME).getAttribute('aria-describedby')).toContain(fieldErrors()[0].id);
      expect(screen.getByLabelText(NAME)).toHaveFocus();
      expect(api.post).not.toHaveBeenCalled();
    });

    it('un clic en el botón con aria-disabled no envía y muestra los cuatro errores', async () => {
      const user = userEvent.setup();
      renderForm();

      await user.click(screen.getByRole('button', { name: SEND }));

      expect(fieldErrors()).toHaveLength(4);
      expect(formAlerts()).toHaveLength(0);
      expect(summary()).toHaveTextContent('home.contactForm.errorSummary:4');
      expect(screen.getByLabelText(NAME)).toHaveFocus();
      expect(api.post).not.toHaveBeenCalled();
    });

    it('el foco va al primer campo con error, no al primero', async () => {
      const user = userEvent.setup();
      renderForm();
      await user.type(screen.getByLabelText(NAME), 'Ana');
      await user.type(screen.getByLabelText(EMAIL), 'ana@uma.es');

      await user.click(screen.getByRole('button', { name: SEND }));

      expect(screen.getByLabelText(SUBJECT)).toHaveFocus();
      expect(fieldErrors()).toHaveLength(2);
      expect(formAlerts()).toHaveLength(0);
      expect(summary()).toHaveTextContent('home.contactForm.errorSummary:2');
    });

    it('tras un envío inválido, un campo que se vuelve a tocar y sale con error vuelve al aviso asertivo (uno solo)', async () => {
      const user = userEvent.setup();
      renderForm();
      await user.click(screen.getByRole('button', { name: SEND }));
      expect(formAlerts()).toHaveLength(0);

      await user.type(screen.getByLabelText(EMAIL), 'juan.perez');
      await user.tab();

      expect(formAlerts()).toHaveLength(1);
      expect(formAlerts()[0]).toHaveTextContent('form.errors.email');
    });

    it('el resumen de errores está montado desde el principio y vacío, y se vacía al ser válido el formulario', async () => {
      const user = userEvent.setup();
      renderForm();
      expect(summary()).toBeInTheDocument();
      expect(summary()).toBeEmptyDOMElement();

      await user.click(screen.getByRole('button', { name: SEND }));
      expect(summary()).not.toBeEmptyDOMElement();

      await fill(user);
      expect(summary()).toBeEmptyDOMElement();
    });

    it('mientras /send-email está en curso un segundo envío no lo repite', async () => {
      let resolve;
      api.post.mockReturnValue(new Promise((r) => { resolve = r; }));
      const user = userEvent.setup();
      renderForm();
      await fill(user);

      await user.click(screen.getByRole('button', { name: SEND }));
      await user.click(screen.getByRole('button', { name: SEND }));

      expect(api.post).toHaveBeenCalledTimes(1);
      await act(async () => resolve({}));
      await user.click(screen.getByRole('button', { name: SEND }));
      expect(api.post).toHaveBeenCalledTimes(2);
    });

    it('el botón queda aria-disabled, con aspecto inactivo y ayuda enlazada, hasta que el formulario es válido', async () => {
      const user = userEvent.setup();
      renderForm();
      const boton = screen.getByRole('button', { name: SEND });

      expect(boton).not.toBeDisabled();
      expect(boton).toHaveAttribute('aria-disabled', 'true');
      expect(boton).toHaveClass('border-dashed', 'text-moss', 'cursor-not-allowed');
      const ayuda = screen.getByText('home.contactForm.submitHelpTitle').closest('div');
      expect(boton).toHaveAttribute('aria-describedby', ayuda.id);
      expect(screen.getByText('home.contactForm.missingName')).toBeInTheDocument();
      expect(screen.getByText('home.contactForm.missingEmail')).toBeInTheDocument();
      expect(screen.getByText('home.contactForm.missingSubject')).toBeInTheDocument();
      expect(screen.getByText('home.contactForm.shortMessage')).toBeInTheDocument();

      await user.type(screen.getByLabelText(EMAIL), 'juan.perez');
      expect(screen.getByText('home.contactForm.invalidEmail')).toBeInTheDocument();
      expect(screen.queryByText('home.contactForm.missingEmail')).not.toBeInTheDocument();

      await user.clear(screen.getByLabelText(EMAIL));
      await fill(user);

      expect(boton).not.toHaveAttribute('aria-disabled');
      expect(boton).not.toHaveAttribute('aria-describedby');
      expect(boton).toHaveClass('bg-brand');
      expect(boton).not.toHaveClass('border-dashed');
      expect(screen.queryByText('home.contactForm.submitHelpTitle')).not.toBeInTheDocument();
    });

    it('el envío válido manda el mismo cuerpo a /send-email', async () => {
      api.post.mockResolvedValue({});
      const user = userEvent.setup();
      renderForm();

      await fillAndSend(user);

      expect(api.post).toHaveBeenCalledWith('/send-email', {
        username: 'Ana',
        email: 'ana@example.com',
        subject: 'Hola',
        message: LONG_MESSAGE,
      });
    });

    it.each([
      ['es', es],
      ['en', en],
    ])('ningún placeholder es igual a su etiqueta (%s) y los textos de ayuda existen', (_idioma, texts) => {
      const form = texts.home.contactForm;

      ['name', 'email', 'subject', 'message'].forEach((field) => {
        expect(form[`${field}Placeholder`]).not.toBe(form[`${field}Label`]);
        expect(form[`${field}Hint`]).toBeTruthy();
      });
      [
        'allRequired',
        'submitHelpTitle',
        'missingName',
        'missingEmail',
        'invalidEmail',
        'missingSubject',
        'shortMessage',
      ].forEach((key) => expect(form[key]).toBeTruthy());
      expect(form.messageHint).toContain('{{min}}');
      expect(form.shortMessage).toContain('{{min}}');
      expect(texts.form.errors.minLength).toContain('{{count}}');
      expect(texts.form.errors.required).toBeTruthy();
      expect(texts.form.errors.email).toBeTruthy();
    });

    it('el formulario no lleva hexadecimales ni el ancho y relleno internos de antes', () => {
      const { container } = renderForm();

      expect(container.innerHTML).not.toMatch(/\[#|max-w-md/);
    });
  });
});
