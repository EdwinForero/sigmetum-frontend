import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import CategoryFilter from './CategoryFilter';

describe('CategoryFilter', () => {
  it('el buscador de la categoría desplegada tiene una etiqueta visible', async () => {
    render(
      <CategoryFilter
        category="province"
        items={['Almería', 'Málaga']}
        blocked={false}
        onChange={() => {}}
        selected={new Set()}
        isExpanded
        onExpand={() => {}}
      />
    );

    const buscador = await screen.findByLabelText('filter.categoryFilter.searchLabel');
    expect(buscador).toHaveClass('placeholder:text-moss');
  });

  it('el título de la categoría usa peso normal (400), no font-medium', () => {
    render(
      <CategoryFilter
        category="province"
        items={['Almería']}
        blocked={false}
        onChange={() => {}}
        selected={new Set()}
        isExpanded={false}
        onExpand={() => {}}
      />
    );

    const titulo = screen.getByText('attributes.province');
    expect(titulo).toHaveClass('font-normal');
    expect(titulo).not.toHaveClass('font-medium');
  });
});
