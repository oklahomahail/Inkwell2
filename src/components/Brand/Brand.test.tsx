import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';

import { Brand } from './Brand';

// Mock BrandMark component
vi.mock('./BrandMark', () => ({
  BrandMark: ({
    collapsed,
    variant,
    size,
  }: {
    collapsed: boolean;
    variant: string;
    size: string;
  }) => (
    <div
      data-testid="brand-mark"
      data-collapsed={collapsed}
      data-variant={variant}
      data-size={size}
    >
      BrandMark
    </div>
  ),
}));

describe('Brand', () => {
  it('renders with default props', () => {
    render(<Brand />);
    const brandMark = screen.getByTestId('brand-mark');
    expect(brandMark).toHaveAttribute('data-collapsed', 'false');
    expect(brandMark).toHaveAttribute('data-variant', 'light');
    expect(brandMark).toHaveAttribute('data-size', 'md');
  });

  it('passes collapsed prop to BrandMark', () => {
    render(<Brand collapsed />);
    const brandMark = screen.getByTestId('brand-mark');
    expect(brandMark).toHaveAttribute('data-collapsed', 'true');
  });

  it('passes variant prop to BrandMark', () => {
    render(<Brand variant="dark" />);
    const brandMark = screen.getByTestId('brand-mark');
    expect(brandMark).toHaveAttribute('data-variant', 'dark');
  });

  it('renders within padding container', () => {
    const { container } = render(<Brand />);
    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass('px-3', 'py-3', 'overflow-hidden');
  });
});
