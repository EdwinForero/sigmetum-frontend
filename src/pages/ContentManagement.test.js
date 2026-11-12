import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import ContentManagement from './ContentManagement';
import ToastProvider from '../components/ToastProvider';
import api from '../services/api';

vi.mock('../services/api', () => ({
  default: { get: vi.fn(), getAuth: vi.fn(), postAuth: vi.fn(), postFormAuth: vi.fn(), deleteAuth: vi.fn() },
}));

const renderPage = () =>
  render(
    <ToastProvider>
      <ContentManagement />
    </ToastProvider>
  );

describe('ContentManagement', () => {
  beforeEach(() => {
    api.get.mockReset().mockResolvedValue([]);
    api.getAuth.mockReset().mockResolvedValue([]);
  });

  it('pinta el título y la descripción de la página', async () => {
    renderPage();
    await screen.findByText('contentManagement.noTermsFoundPlaceholder');

    expect(screen.getByText('contentManagement.title')).toBeInTheDocument();
    expect(screen.getByText('contentManagement.description')).toBeInTheDocument();
  });

  it('pinta las tres secciones: términos, galería y destinatarios', async () => {
    renderPage();
    await screen.findByText('contentManagement.noTermsFoundPlaceholder');

    expect(screen.getByText('contentManagement.noLatinTermsTitle')).toBeInTheDocument();
    expect(screen.getByText('contentManagement.galleryManagementTitle')).toBeInTheDocument();
    expect(api.get).toHaveBeenCalledWith('/list-terms');
    expect(api.get).toHaveBeenCalledWith('/list-images');
    expect(screen.getByText('contactRecipients.title')).toBeInTheDocument();
    expect(api.getAuth).toHaveBeenCalledWith('/list-recipients');
  });

  it('el panel de destinatarios ocupa las dos columnas con ancho acotado y va tras la galería', async () => {
    renderPage();
    await screen.findByText('contentManagement.noTermsFoundPlaceholder');

    const panel = screen.getByRole('region', { name: 'contactRecipients.title' });
    expect(panel.parentElement).toHaveClass('lg:col-span-2', 'max-w-3xl');
    const secciones = screen.getAllByRole('region');
    expect(secciones.map((s) => s.getAttribute('aria-labelledby'))).toHaveLength(3);
    expect(secciones[2]).toBe(panel);
  });

  it('si el panel de destinatarios falla, términos y galería siguen funcionando', async () => {
    api.getAuth.mockRejectedValue(new Error('404'));
    renderPage();

    expect(await screen.findByText('contactRecipients.errorLoad')).toBeInTheDocument();
    expect(await screen.findByText('contentManagement.noTermsFoundPlaceholder')).toBeInTheDocument();
    expect(screen.getByText('contentManagement.galleryManagementTitle')).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });

  it('tiene un único h1, un contenedor max-w-6xl y las secciones en una rejilla', async () => {
    const { container } = renderPage();
    await screen.findByText('contentManagement.noTermsFoundPlaceholder');

    const h1 = screen.getAllByRole('heading', { level: 1 });
    expect(h1).toHaveLength(1);
    expect(h1[0]).toHaveTextContent('contentManagement.title');
    expect(container.querySelector('.max-w-6xl')).toBeInTheDocument();
    expect(container.firstChild).toHaveClass('mx-auto', 'w-full', 'max-w-6xl', 'px-4', 'sm:px-5', 'pb-6');
    expect(container.querySelector('.grid.lg\\:grid-cols-2')).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(3);
  });

  it('no usa anchos fijos que desbordan a 320 px', async () => {
    const { container } = renderPage();
    await screen.findByText('contentManagement.noTermsFoundPlaceholder');

    ['.px-40', '.min-w-72', '.max-w-screen', '.min-w-screen', '.min-h-screen'].forEach((selector) =>
      expect(container.querySelector(selector)).toBeNull()
    );
    expect(container.querySelector('[class*="w-[512px]"]')).toBeNull();
  });
});
