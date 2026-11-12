import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Pagination from './Pagination';

describe('Pagination', () => {
  it('los botones anterior y siguiente tienen nombre accesible y llaman a onPageChange', async () => {
    const onPageChange = vi.fn();
    const user = userEvent.setup();
    render(<Pagination currentPage={2} totalPages={3} onPageChange={onPageChange} />);

    await user.click(screen.getByRole('button', { name: 'iconButton.previousPage' }));
    await user.click(screen.getByRole('button', { name: 'iconButton.nextPage' }));

    expect(onPageChange.mock.calls).toEqual([['prev'], ['next']]);
  });

  it('el texto de página usa tokens y la escala: text-ink, text-base y font-bold, sin hex', () => {
    const { container } = render(<Pagination currentPage={1} totalPages={3} onPageChange={() => {}} />);

    const info = screen.getByText('pagination.pageInfo');
    expect(info).toHaveClass('text-ink', 'text-base', 'font-bold');
    expect(container.innerHTML).not.toMatch(/\[#[0-9A-Fa-f]{3,8}\]|font-semibold|text-lg/);
  });
});
