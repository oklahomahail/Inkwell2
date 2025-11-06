/**
 * Button Component Tests
 *
 * Tests for the Button component with variants and sizes
 */

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Button } from '../Button';

describe('Button', () => {
  it('renders with children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('applies default variant by default', () => {
    render(<Button>Default</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-blue-600', 'text-white');
  });

  it('applies secondary variant', () => {
    render(<Button variant="secondary">Secondary</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-gray-700', 'text-gray-100');
  });

  it('applies ghost variant', () => {
    render(<Button variant="ghost">Ghost</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-transparent', 'text-gray-200');
  });

  it('applies destructive variant', () => {
    render(<Button variant="destructive">Delete</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-red-600', 'text-white');
  });

  it('applies outline variant', () => {
    render(<Button variant="outline">Outline</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('border', 'border-gray-600', 'text-gray-100');
  });

  it('applies small size', () => {
    render(<Button size="sm">Small</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('h-8', 'px-2', 'text-xs');
  });

  it('applies medium size by default', () => {
    render(<Button>Medium</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('h-9', 'px-3', 'text-sm');
  });

  it('applies large size', () => {
    render(<Button size="lg">Large</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('h-10', 'px-4', 'text-base');
  });

  it('applies icon size', () => {
    render(<Button size="icon">+</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('h-9', 'w-9', 'p-0');
  });

  it('applies custom className', () => {
    render(<Button className="custom-class">Custom</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
  });

  it('forwards ref correctly', () => {
    const ref = { current: null };
    render(<Button ref={ref as any}>Ref Test</Button>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it('passes through button props', () => {
    render(
      <Button type="submit" disabled>
        Submit
      </Button>,
    );
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('type', 'submit');
    expect(button).toBeDisabled();
  });

  it('applies base classes for accessibility and transitions', () => {
    render(<Button>Test</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass(
      'inline-flex',
      'items-center',
      'justify-center',
      'rounded-md',
      'font-medium',
      'transition-colors',
      'focus:outline-none',
      'focus:ring-2',
    );
  });

  it('combines variant, size, and custom classes', () => {
    render(
      <Button variant="destructive" size="lg" className="custom">
        Combined
      </Button>,
    );
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-red-600'); // variant
    expect(button).toHaveClass('h-10'); // size
    expect(button).toHaveClass('custom'); // custom className
  });
});
