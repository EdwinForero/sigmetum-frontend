import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ContactForm from './ContactForm';
import api from '../services/api';

vi.mock('../services/api', () => ({ default: { post: vi.fn() } }));

const httpError = (status) => Object.assign(new Error(`http_${status}`), { type: 'http', status });

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
    render(<ContactForm onLoad={vi.fn()} />);

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
    render(<ContactForm onLoad={vi.fn()} />);

    await fillAndSend(user);

    expect(await screen.findByText(key)).toBeInTheDocument();
  });
  it('asocia cada etiqueta con su campo', () => {
    render(<ContactForm onLoad={vi.fn()} />);

    expect(screen.getByLabelText('home.contactForm.nameLabel')).toHaveAttribute('type', 'text');
    expect(screen.getByLabelText('home.contactForm.emailPlaceholder')).toHaveAttribute('type', 'email');
    expect(screen.getByLabelText('home.contactForm.subjectPlaceholder')).toHaveAttribute('type', 'text');
    expect(screen.getByLabelText('home.contactForm.messagePlaceholder').tagName).toBe('TEXTAREA');
  });

  it('dos instancias tienen ids distintos en sus campos', () => {
    render(
      <>
        <ContactForm onLoad={vi.fn()} />
        <ContactForm onLoad={vi.fn()} />
      </>
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
});
