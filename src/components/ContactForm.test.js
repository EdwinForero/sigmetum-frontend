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
});
