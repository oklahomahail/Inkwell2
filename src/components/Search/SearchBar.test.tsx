// src/components/SearchBar.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { SearchBar } from './SearchBar';

test('submits trimmed query', () => {
  const onSearch = vi.fn();
  render(<SearchBar onSearch={onSearch} />);
  const input = screen.getByRole('textbox');
  fireEvent.change(input, { target: { value: '  wizard  ' } });
  fireEvent.submit(input.closest('form')!);
  expect(onSearch).toHaveBeenCalledWith('wizard');
});

test('clears query', () => {
  const onSearch = vi.fn();
  render(<SearchBar onSearch={onSearch} />);
  const input = screen.getByRole('textbox');
  fireEvent.change(input, { target: { value: 'test' } });
  fireEvent.click(screen.getByRole('button', { name: /clear/i }));
  expect(onSearch).toHaveBeenCalledWith('');
  expect((input as HTMLInputElement).value).toBe('');
});
