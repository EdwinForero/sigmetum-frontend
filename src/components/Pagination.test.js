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
});
