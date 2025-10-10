// InkwellFeather Icon System Tests
// Comprehensive test coverage for icon component, registry, and variants

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import InkwellFeather, {
  INKWELL_ICONS,
  ICON_SIZES,
  ICON_COLORS,
  type InkwellIconName,
  type IconSize,
  type IconColor,
} from './InkwellFeather';

// Mock console.warn to test error handling
const mockConsoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});

describe('InkwellFeather Icon System', () => {
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

  describe('Size Variants', () => {
    it('should have proper size classes defined', () => {
      expect(ICON_SIZES.xs).toBe('w-3 h-3');
      expect(ICON_SIZES.sm).toBe('w-4 h-4');
      expect(ICON_SIZES.md).toBe('w-5 h-5');
      expect(ICON_SIZES.lg).toBe('w-6 h-6');
      expect(ICON_SIZES.xl).toBe('w-8 h-8');
      expect(ICON_SIZES['2xl']).toBe('w-12 h-12');
    });

    it('should apply correct size classes to rendered icons', () => {
      const sizes: IconSize[] = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];

      sizes.forEach((size, index) => {
        render(<InkwellFeather name="home" size={size} data-testid={`icon-${size}`} />);
        const icon = screen.getByTestId(`icon-${size}`);
        const expectedClass = ICON_SIZES[size];

        expect(icon).toHaveClass(expectedClass.split(' ')[0]); // w-x
        expect(icon).toHaveClass(expectedClass.split(' ')[1]); // h-x
      });
    });
  });

  describe('Color Variants', () => {
    it('should have proper color classes defined', () => {
      expect(ICON_COLORS.default).toBe('text-gray-600 dark:text-gray-400');
      expect(ICON_COLORS.primary).toBe('text-blue-600 dark:text-blue-400');
      expect(ICON_COLORS.success).toBe('text-green-600 dark:text-green-400');
      expect(ICON_COLORS.warning).toBe('text-amber-600 dark:text-amber-400');
      expect(ICON_COLORS.error).toBe('text-red-600 dark:text-red-400');
      expect(ICON_COLORS.brand).toBe('text-amber-600 dark:text-amber-400');
    });

    it('should apply correct color classes to rendered icons', () => {
      const colors: IconColor[] = ['default', 'primary', 'success', 'warning', 'error', 'brand'];

      colors.forEach((color) => {
        render(<InkwellFeather name="home" color={color} data-testid={`icon-${color}`} />);
        const icon = screen.getByTestId(`icon-${color}`);
        const expectedClasses = ICON_COLORS[color].split(' ');

        expectedClasses.forEach((expectedClass) => {
          expect(icon).toHaveClass(expectedClass);
        });
      });
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

  describe('Performance', () => {
    it('should render multiple icons efficiently', () => {
      const iconNames = Object.keys(INKWELL_ICONS).slice(0, 10) as InkwellIconName[];

      const start = performance.now();

      iconNames.forEach((name, index) => {
        render(<InkwellFeather name={name} data-testid={`perf-${index}`} />);
      });

      const end = performance.now();
      const renderTime = end - start;

      // Should render 10 icons in reasonable time (less than 100ms)
      expect(renderTime).toBeLessThan(100);
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

// Clean up mocks
afterEach(() => {
  mockConsoleWarn.mockClear();
});

afterAll(() => {
  mockConsoleWarn.mockRestore();
});
