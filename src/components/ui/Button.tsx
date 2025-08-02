import React, { forwardRef } from 'react';

// Utility function to combine class names
const cn = (...classes: (string | undefined)[]) => classes.filter(Boolean).join(' ');

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

<<<<<<< HEAD
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ 
  variant = 'primary', 
  size = 'md', 
  children, 
  className = '', 
  disabled = false,
  ...props 
}, ref) => {
  const variants = {
    primary: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm border-transparent',
    secondary: 'bg-white hover:bg-gray-50 text-gray-900 border-gray-300 shadow-sm',
    ghost: 'bg-transparent hover:bg-gray-100 text-gray-700 border-transparent',
    danger: 'bg-red-600 hover:bg-red-700 text-white shadow-sm border-transparent',
    outline: 'bg-transparent hover:bg-gray-50 text-gray-700 border-gray-300'
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm h-8',
    md: 'px-4 py-2 text-sm h-10',
    lg: 'px-6 py-3 text-base h-12'
  };
  
  return (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center rounded-lg border font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
});

Button.displayName = 'Button';
=======
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', children, className, disabled = false, ...props }, ref) => {
    const variants = {
      primary: 'bg-indigo-600 hover:bg-indigo-700 text-white border-transparent shadow-sm',
      secondary: 'bg-white hover:bg-gray-50 text-gray-900 border-gray-300 shadow-sm',
      ghost: 'bg-transparent hover:bg-gray-100 text-gray-700 border-transparent',
      danger: 'bg-red-600 hover:bg-red-700 text-white border-transparent shadow-sm',
      outline: 'bg-transparent hover:bg-gray-50 text-gray-700 border border-gray-300',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm h-8',
      md: 'px-4 py-2 text-sm h-10',
      lg: 'px-6 py-3 text-base h-12',
    };

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
          variants[variant],
          sizes[size],
          className,
        )}
        {...props}
      >
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';
>>>>>>> 50e9b09 (🔧 Final cleanup: Husky hooks, linting, Tailwind, and config updates)
