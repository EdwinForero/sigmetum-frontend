import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import ContentManagement from './ContentManagement';
import ToastProvider from '../components/ToastProvider';
import api from '../services/api';

vi.mock('../services/api', () => ({
  default: { get: vi.fn(), postAuth: vi.fn(), postFormAuth: vi.fn(), deleteAuth: vi.fn() },
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
  });

  it('pinta el título y la descripción de la página', async () => {
    renderPage();
    await screen.findByText('contentManagement.noTermsFoundPlaceholder');

    expect(screen.getByText('contentManagement.title')).toBeInTheDocument();
    expect(screen.getByText('contentManagement.description')).toBeInTheDocument();
  });

  it('pinta las dos secciones: términos y galería', async () => {
    renderPage();
    await screen.findByText('contentManagement.noTermsFoundPlaceholder');

    expect(screen.getByText('contentManagement.noLatinTermsTitle')).toBeInTheDocument();
    expect(screen.getByText('contentManagement.galleryManagementTitle')).toBeInTheDocument();
    expect(api.get).toHaveBeenCalledWith('/list-terms');
    expect(api.get).toHaveBeenCalledWith('/list-images');
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
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(2);
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
