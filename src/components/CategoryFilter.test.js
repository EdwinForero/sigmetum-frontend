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
});
