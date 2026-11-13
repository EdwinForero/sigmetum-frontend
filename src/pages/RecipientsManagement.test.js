import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RecipientsManagement from './RecipientsManagement';
import ToastProvider from '../components/ToastProvider';
import api from '../services/api';

vi.mock('../services/api', () => ({
  default: { get: vi.fn(), getAuth: vi.fn(), postAuth: vi.fn(), postFormAuth: vi.fn(), deleteAuth: vi.fn() },
}));

const TITLE = 'contactRecipients.title';

const renderPage = () =>
  render(
    <ToastProvider>
      <RecipientsManagement />
    </ToastProvider>
  );

describe('RecipientsManagement', () => {
  beforeEach(() => {
    api.get.mockReset().mockResolvedValue([]);
    api.getAuth.mockReset().mockResolvedValue([]);
    api.deleteAuth.mockReset().mockResolvedValue({});
  });

  it('tiene un único h1 con el título del gestor y ningún h2', async () => {
    renderPage();
    await screen.findByText('contactRecipients.empty');

    const h1 = screen.getAllByRole('heading', { level: 1 });
    expect(h1).toHaveLength(1);
    expect(h1[0]).toHaveTextContent(TITLE);
    expect(screen.queryAllByRole('heading', { level: 2 })).toHaveLength(0);
  });

  it('el contenedor es el común de las privadas, sin rejilla ni columnas', async () => {
    const { container } = renderPage();
    await screen.findByText('contactRecipients.empty');

    expect(container.firstChild).toHaveClass('mx-auto', 'w-full', 'max-w-6xl', 'px-4', 'sm:px-5', 'pb-6', 'animate-page-fade', 'motion-reduce:animate-none');
    expect(container.querySelector('.grid')).toBeNull();
    expect(container.querySelector('[class*="lg:col-span-2"]')).toBeNull();
    expect(container.querySelector('[class*="lg:grid-cols"]')).toBeNull();
  });

  it('no usa anchos fijos que desbordan a 320 px', async () => {
    const { container } = renderPage();
    await screen.findByText('contactRecipients.empty');

    ['.px-40', '.min-w-72', '.max-w-screen', '.min-w-screen', '.min-h-screen'].forEach((selector) =>
      expect(container.querySelector(selector)).toBeNull()
    );
    expect(container.querySelector('[class*="w-[512px]"]')).toBeNull();
  });

  it('pide la lista con la sesión y, tras quitar un correo, el foco vuelve al h1 (C6)', async () => {
    const user = userEvent.setup();
    api.getAuth.mockResolvedValue([{ email: 'ana@x.es' }, { email: 'luis@x.es' }]);
    renderPage();
    expect(api.getAuth).toHaveBeenCalledWith('/list-recipients');

    await user.click((await screen.findAllByRole('button', { name: 'contactRecipients.removeRecipient' }))[0]);
    const dialogo = await screen.findByRole('dialog');
    await user.click(within(dialogo).getByRole('button', { name: 'dialogAdvice.deleteButton' }));

    await waitFor(() => expect(screen.getByRole('heading', { level: 1 })).toHaveFocus());
  });
});
