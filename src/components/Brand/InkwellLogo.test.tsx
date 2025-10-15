import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';

import { InkwellLogo } from './InkwellLogo';

describe('InkwellLogo', () => {
  describe('Size Variants', () => {
    it('applies default size class (md)', () => {
      render(<InkwellLogo />);
      const logo = screen.getByText('Inkwell').parentElement;
      expect(logo).toHaveClass('h-8');
    });

    it.each(['sm', 'md', 'lg', 'xl'] as const)('applies %s size class', (size) => {
      const sizeMap = { sm: 'h-6', md: 'h-8', lg: 'h-12', xl: 'h-16' };
      render(<InkwellLogo size={size} />);
      const logo = screen.getByText('Inkwell').parentElement;
      expect(logo).toHaveClass(sizeMap[size]);
    });
  });

  describe('Color Variants', () => {
    const colorMap = {
      navy: 'text-inkwell-navy',
      gold: 'text-inkwell-gold',
      white: 'text-white',
      auto: '',
    };

    it('applies default color class (auto)', () => {
      render(<InkwellLogo />);
      const logo = screen.getByText('Inkwell').parentElement;
      expect(logo.className).not.toContain('text-inkwell');
      expect(logo.className).not.toContain('text-white');
    });

    it.each(['navy', 'gold', 'white', 'auto'] as const)('applies %s color class', (color) => {
      render(<InkwellLogo color={color} />);
      const logo = screen.getByText('Inkwell').parentElement;
      if (color === 'auto') {
        expect(logo.className).not.toContain('text-inkwell');
        expect(logo.className).not.toContain('text-white');
      } else {
        expect(logo).toHaveClass(colorMap[color]);
      }
    });
  });

  describe('Variants', () => {
    it('renders full logo by default', () => {
      render(<InkwellLogo />);
      const logo = screen.getByTestId('inkwell-logo');
      expect(logo).toBeInTheDocument();
      expect(screen.getByText('Inkwell')).toBeInTheDocument();
    });

    it('renders mark/icon variant', () => {
      render(<InkwellLogo variant="mark" />);
      const logo = screen.getByTestId('inkwell-logo');
      expect(logo).toBeInTheDocument();
      expect(screen.queryByText('Inkwell')).not.toBeInTheDocument();
    });

    it('renders wordmark variant', () => {
      render(<InkwellLogo variant="wordmark" />);
      expect(screen.queryByRole('img', { hidden: true })).not.toBeInTheDocument();
      expect(screen.getByText('Inkwell')).toBeInTheDocument();
    });
  });

  it('applies custom className', () => {
    render(<InkwellLogo className="custom-class" />);
    const logo = screen.getByText('Inkwell').parentElement;
    expect(logo).toHaveClass('custom-class');
  });
});
