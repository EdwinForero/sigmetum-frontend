import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import TermsManager from './TermsManager';
import api from '../services/api';

vi.mock('../services/api', () => ({
  default: { get: vi.fn(), postAuth: vi.fn(), deleteAuth: vi.fn() },
}));

describe('TermsManager', () => {
  beforeEach(() => {
    api.get.mockReset().mockResolvedValue([{ term: 'subsp.' }, { term: 'var.' }]);
  });

  it('el botón de añadir tiene nombre accesible', async () => {
    render(<TermsManager />);
    await screen.findByText('subsp.');

    expect(screen.getByRole('button', { name: 'iconButton.add' })).toBeInTheDocument();
  });

  it('las papeleras tienen nombre accesible y anillo de foco', async () => {
    render(<TermsManager />);

    const papeleras = await screen.findAllByRole('button', { name: 'iconButton.delete' });

    expect(papeleras).toHaveLength(2);
    papeleras.forEach((papelera) => expect(papelera).toHaveClass('focus-ring'));
  });
});
