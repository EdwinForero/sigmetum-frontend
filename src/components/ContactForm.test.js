import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ContactForm from './ContactForm';
import ToastProvider from './ToastProvider';
import api from '../services/api';

vi.mock('../services/api', () => ({ default: { post: vi.fn() } }));

const httpError = (status) => Object.assign(new Error(`http_${status}`), { type: 'http', status });

const renderForm = () =>
  render(
    <ToastProvider>
      <ContactForm onLoad={vi.fn()} />
    </ToastProvider>
  );

const fillAndSend = async (user) => {
  await user.type(screen.getByPlaceholderText('home.contactForm.namePlaceholder'), 'Ana');
  await user.type(screen.getByPlaceholderText('home.contactForm.emailPlaceholder'), 'ana@example.com');
  await user.type(screen.getByPlaceholderText('home.contactForm.subjectPlaceholder'), 'Hola');
  await user.type(screen.getByPlaceholderText('home.contactForm.messagePlaceholder'), 'Mensaje');
  await user.click(screen.getByText('home.contactForm.sendButton'));
};

describe('ContactForm', () => {
  beforeEach(() => {
    api.post.mockReset();
  });

  it('limita la longitud de los cuatro campos', () => {
    renderForm();

    expect(screen.getByPlaceholderText('home.contactForm.namePlaceholder')).toHaveAttribute('maxLength', '100');
    expect(screen.getByPlaceholderText('home.contactForm.emailPlaceholder')).toHaveAttribute('maxLength', '254');
    expect(screen.getByPlaceholderText('home.contactForm.subjectPlaceholder')).toHaveAttribute('maxLength', '150');
    expect(screen.getByPlaceholderText('home.contactForm.messagePlaceholder')).toHaveAttribute('maxLength', '2000');
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
    const enviar = screen.getByText('home.contactForm.sendButton');
    expect(aviso.compareDocumentPosition(enviar) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    await user.click(enviar);

    await screen.findByText('dialogAdvice.successEmailMessage');
    expect(screen.queryByText('dialogAdvice.errorEmailMessage')).not.toBeInTheDocument();
  });
  it('asocia cada etiqueta con su campo', () => {
    renderForm();

    expect(screen.getByLabelText('home.contactForm.nameLabel')).toHaveAttribute('type', 'text');
    expect(screen.getByLabelText('home.contactForm.emailPlaceholder')).toHaveAttribute('type', 'email');
    expect(screen.getByLabelText('home.contactForm.subjectPlaceholder')).toHaveAttribute('type', 'text');
    expect(screen.getByLabelText('home.contactForm.messagePlaceholder').tagName).toBe('TEXTAREA');
  });

  it('dos instancias tienen ids distintos en sus campos', () => {
    render(
      <ToastProvider>
        <ContactForm onLoad={vi.fn()} />
        <ContactForm onLoad={vi.fn()} />
      </ToastProvider>
    );

    const ids = [
      ...screen.getAllByPlaceholderText('home.contactForm.namePlaceholder'),
      ...screen.getAllByPlaceholderText('home.contactForm.emailPlaceholder'),
      ...screen.getAllByPlaceholderText('home.contactForm.subjectPlaceholder'),
      ...screen.getAllByPlaceholderText('home.contactForm.messagePlaceholder'),
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

    [
      'home.contactForm.nameLabel',
      'home.contactForm.emailPlaceholder',
      'home.contactForm.subjectPlaceholder',
      'home.contactForm.messagePlaceholder',
    ].forEach((label) => {
      const campo = screen.getByLabelText(label);
      expect(campo).toHaveClass('focus-ring');
      expect(campo.className).not.toMatch(/focus:outline/);
    });
  });
});
