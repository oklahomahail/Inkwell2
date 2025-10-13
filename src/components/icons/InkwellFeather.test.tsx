// InkwellFeather Icon System Tests
// Comprehensive test coverage for icon component, registry, and variants

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import InkwellFeather, {
  INKWELL_ICONS,
  ICON_SIZES,
  ICON_COLORS,
  type InkwellIconName,
} from './InkwellFeather';

describe('InkwellFeather Icon System', () => {
  let mockConsoleWarn: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    mockConsoleWarn = vi.spyOn(console, 'warn');
  });

  afterEach(() => {
    mockConsoleWarn.mockClear();
  });

  afterAll(() => {
    mockConsoleWarn.mockRestore();
  });
  describe('Icon Registry', () => {
    it('should have consistent icon registry with expected icons', () => {
      expect(INKWELL_ICONS).toBeDefined();
      expect(typeof INKWELL_ICONS).toBe('object');

      // Test core navigation icons are present
      expect(INKWELL_ICONS.home).toBeDefined();
      expect(INKWELL_ICONS.settings).toBeDefined();
      expect(INKWELL_ICONS.analytics).toBeDefined();
      expect(INKWELL_ICONS.timeline).toBeDefined();
      expect(INKWELL_ICONS.writing).toBeDefined();
      expect(INKWELL_ICONS.planning).toBeDefined();

      // Test writing icons are present
      expect(INKWELL_ICONS.edit).toBeDefined();
      expect(INKWELL_ICONS.document).toBeDefined();
      expect(INKWELL_ICONS.save).toBeDefined();

      // Test UI icons are present
      expect(INKWELL_ICONS.add).toBeDefined();
      expect(INKWELL_ICONS.delete).toBeDefined();
      expect(INKWELL_ICONS.check).toBeDefined();
      expect(INKWELL_ICONS.close).toBeDefined();
    });

    it('should have all icons as valid React components', () => {
      Object.entries(INKWELL_ICONS).forEach(([name, IconComponent]) => {
        // Should be callable/renderable
        expect(IconComponent).toBeDefined();
        expect(IconComponent).not.toBeNull();

        // Try to render each icon to ensure it's a valid React component
        expect(() => {
          render(<InkwellFeather name={name as InkwellIconName} />);
        }).not.toThrow();
      });
    });
  });

  describe('Size and Color Variants', () => {
    it('should have all size variants defined and working', () => {
      // Test that size constants are defined
      expect(ICON_SIZES.xs).toBeDefined();
      expect(ICON_SIZES.md).toBeDefined();
      expect(ICON_SIZES['2xl']).toBeDefined();

      // Test rendering with different sizes
      render(<InkwellFeather name="home" size="xs" data-testid="icon-xs" />);
      render(<InkwellFeather name="home" size="lg" data-testid="icon-lg" />);

      expect(screen.getByTestId('icon-xs')).toHaveClass('w-3', 'h-3');
      expect(screen.getByTestId('icon-lg')).toHaveClass('w-6', 'h-6');
    });

    it('should have all color variants defined and working', () => {
      // Test that color constants are defined
      expect(ICON_COLORS.default).toBeDefined();
      expect(ICON_COLORS.brand).toBeDefined();
      expect(ICON_COLORS.error).toBeDefined();

      // Test rendering with different colors
      render(<InkwellFeather name="home" color="default" data-testid="icon-default" />);
      render(<InkwellFeather name="home" color="brand" data-testid="icon-brand" />);

      expect(screen.getByTestId('icon-default')).toHaveClass('text-gray-600');
      expect(screen.getByTestId('icon-brand')).toHaveClass('text-amber-600');
    });
  });

  describe('InkwellFeather Component', () => {
    it('should render valid icon with default props', () => {
      render(<InkwellFeather name="home" data-testid="test-icon" />);
      const icon = screen.getByTestId('test-icon');

      expect(icon).toBeInTheDocument();
      expect(icon).toHaveClass('w-5', 'h-5'); // default md size
      expect(icon).toHaveClass('text-gray-600'); // default color
    });

    it('should apply custom className alongside default classes', () => {
      render(
        <InkwellFeather
          name="home"
          className="custom-class hover:text-blue-500"
          data-testid="custom-icon"
        />,
      );
      const icon = screen.getByTestId('custom-icon');

      expect(icon).toHaveClass(
        'w-5',
        'h-5',
        'text-gray-600',
        'custom-class',
        'hover:text-blue-500',
      );
    });

    it('should set proper accessibility attributes', () => {
      render(
        <InkwellFeather
          name="home"
          aria-label="Go to homepage"
          title="Homepage navigation"
          data-testid="accessible-icon"
        />,
      );
      const icon = screen.getByTestId('accessible-icon');

      expect(icon).toHaveAttribute('aria-label', 'Go to homepage');
      expect(icon).toHaveAttribute('title', 'Homepage navigation');
    });

    it('should use default aria-label from icon name when not provided', () => {
      render(<InkwellFeather name="chevron-left" data-testid="default-aria" />);
      const icon = screen.getByTestId('default-aria');

      expect(icon).toHaveAttribute('aria-label', 'chevron left');
    });

    it('should handle invalid icon names gracefully', () => {
      render(<InkwellFeather name={'invalid-icon' as InkwellIconName} />);

      expect(mockConsoleWarn).toHaveBeenCalledWith('InkwellFeather: Unknown icon "invalid-icon"');
    });

    it('should return null for invalid icon names', () => {
      const { container } = render(<InkwellFeather name={'invalid-icon' as InkwellIconName} />);

      expect(container.firstChild).toBeNull();
    });
  });

  describe('Icon Name Type Safety', () => {
    it('should accept all valid icon names from registry', () => {
      const validNames = Object.keys(INKWELL_ICONS) as InkwellIconName[];

      validNames.forEach((name) => {
        expect(() => {
          render(<InkwellFeather name={name} />);
        }).not.toThrow();
      });
    });
  });

  describe('Integration Tests', () => {
    it('should render different icon combinations correctly', () => {
      const combinations = [
        { name: 'home' as const, size: 'lg' as const, color: 'primary' as const },
        { name: 'writing' as const, size: 'sm' as const, color: 'brand' as const },
        { name: 'analytics' as const, size: 'xl' as const, color: 'success' as const },
      ];

      combinations.forEach((combo, index) => {
        render(
          <InkwellFeather
            name={combo.name}
            size={combo.size}
            color={combo.color}
            data-testid={`combo-${index}`}
          />,
        );

        const icon = screen.getByTestId(`combo-${index}`);
        expect(icon).toBeInTheDocument();

        // Check size classes
        const sizeClasses = ICON_SIZES[combo.size].split(' ');
        sizeClasses.forEach((cls) => expect(icon).toHaveClass(cls));

        // Check color classes
        const colorClasses = ICON_COLORS[combo.color].split(' ');
        colorClasses.forEach((cls) => expect(icon).toHaveClass(cls));
      });
    });

    it('should handle edge cases with special characters in icon names', () => {
      const specialNames: InkwellIconName[] = ['chevron-left', 'arrow-right', 'more-horizontal'];

      specialNames.forEach((name) => {
        render(<InkwellFeather name={name} data-testid={name} />);
        const icon = screen.getByTestId(name);

        expect(icon).toBeInTheDocument();
        expect(icon).toHaveAttribute('aria-label', name.replace('-', ' '));
      });
    });
  });

  describe('Exports', () => {
    it('should export all necessary types and components', () => {
      expect(InkwellFeather).toBeDefined();
      expect(INKWELL_ICONS).toBeDefined();
      expect(ICON_SIZES).toBeDefined();
      expect(ICON_COLORS).toBeDefined();
    });
  });
});
