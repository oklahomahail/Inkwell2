// src/components/Search/SearchBar.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { NavProvider } from '../../context/NavContext';
import { SearchBar } from './SearchBar';

const renderWithProviders = (ui: React.ReactElement) => render(<NavProvider>{ui}</NavProvider>);

describe('SearchBar', () => {
  it('submits trimmed query', () => {
    const onSearch = vi.fn();
    renderWithProviders(<SearchBar onSearch={onSearch} />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '  wizard  ' } });
    fireEvent.submit(input.closest('form')!);

    expect(onSearch).toHaveBeenCalledWith('wizard');
  });

  it('clears query', () => {
    const onSearch = vi.fn();
    renderWithProviders(<SearchBar onSearch={onSearch} />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'test' } });
    fireEvent.click(screen.getByRole('button', { name: /clear/i }));

    expect(onSearch).toHaveBeenCalledWith('');
    expect((input as HTMLInputElement).value).toBe('');
  });
});
