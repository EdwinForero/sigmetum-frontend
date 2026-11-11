import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Explore from './Explore';
import ToastProvider from '../components/ToastProvider';
import { assetUrl } from '../config/assets';

vi.mock('../components/SpeciesCard', () => ({
  default: ({ species }) => <div data-testid="species">{species['Especies Características']}</div>,
}));
vi.mock('../utilities/CSVfunctions', () => ({ downloadXLSX: vi.fn() }));
vi.mock('../config/assets', async (importOriginal) => {
  const original = await importOriginal();
  return { ...original, assetUrl: vi.fn(() => 'https://cdn.example/glossary.pdf') };
});

const species = [
  { 'Especies Características': ['Quercus ilex', 'Pinus pinea'] },
  { 'Especies Características': ['Quercus ilex', 'Juniperus oxycedrus'] },
];

const renderExplore = (props = {}) =>
  render(
    <ToastProvider>
      <Explore data={[]} filteredSpecies={species} selectedSpecies={new Set()} noItalicTerms={[]} {...props} />
    </ToastProvider>
  );

describe('Explore', () => {
  it('muestra el título, el recuento y una tarjeta por especie única ordenada', () => {
    renderExplore();

    expect(screen.getByRole('heading', { level: 1, name: 'explore.title' })).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByText('explore.resultsInfo')).toBeInTheDocument();
    expect(screen.getAllByTestId('species').map((el) => el.textContent)).toEqual([
      'Juniperus oxycedrus',
      'Pinus pinea',
      'Quercus ilex',
    ]);
  });

  it('sin resultados muestra el texto de vacío', () => {
    renderExplore({ filteredSpecies: [] });

    expect(screen.getByText('explore.noDataFoundPlaceholder')).toBeInTheDocument();
    expect(screen.queryByText('explore.title')).not.toBeInTheDocument();
  });

  it('con hasError muestra el texto de error de carga', () => {
    renderExplore({ hasError: true });

    expect(screen.getByText('explore.errorLoadPlaceholder')).toBeInTheDocument();
  });

  it('el contenedor y la barra de herramientas no desbordan: sin whitespace-nowrap, con min-w-0, flex-wrap y gap', () => {
    renderExplore();

    const container = screen.getByRole('heading', { level: 1, name: 'explore.title' }).parentElement;
    expect(container).not.toHaveClass('whitespace-nowrap');
    expect(container).toHaveClass('min-w-0');
    const toolbar = screen.getByText('explore.resultsInfo').parentElement;
    expect(toolbar).toHaveClass('flex-wrap', 'gap-2');
    expect(toolbar.className).not.toMatch(/\bw-\[\d+px\]|\bmin-w-\[\d+px\]/);
  });

  it('el título es verde oscuro de marca (brand-deep)', () => {
    renderExplore();

    expect(screen.getByRole('heading', { level: 1, name: 'explore.title' })).toHaveClass('text-brand-deep');
  });

  it('si la descarga del glosario falla avisa con un error persistente, sin diálogo', async () => {
    assetUrl.mockImplementationOnce(() => {
      throw new Error('sin url');
    });
    const user = userEvent.setup();
    renderExplore();

    await user.click(screen.getByText('explore.downloadGlossaryButton'));

    const aviso = await screen.findByText('dialogAdvice.errorDownloadFile');
    expect(aviso.closest('[role=alert]')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
