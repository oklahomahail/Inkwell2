import * as React from 'react';
export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
  variant?: 'default' | 'secondary' | 'ghost' | 'destructive' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'icon';
};
const variantClasses: Record<NonNullable<ButtonProps['variant']>, string> = {
  default: 'bg-blue-600 text-white hover:bg-blue-500 focus:ring-blue-400',
  secondary: 'bg-gray-700 text-gray-100 hover:bg-gray-600 focus:ring-gray-400',
  ghost: 'bg-transparent text-gray-200 hover:bg-gray-800/50 focus:ring-gray-400',
  destructive: 'bg-red-600 text-white hover:bg-red-500 focus:ring-red-400',
  outline: 'border border-gray-600 text-gray-100 hover:bg-gray-800/40 focus:ring-gray-400',
};
const sizeClasses: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'h-8 px-2 text-xs',
  md: 'h-9 px-3 text-sm',
  lg: 'h-10 px-4 text-base',
  icon: 'h-9 w-9 p-0',
};
export const Button: React.FC<ButtonProps> = ({
  className = '',
  _children,
  _variant = 'default',
  _size = 'md',
  ...rest
}) => {
  const base =
    'inline-flex items-center justify-center rounded-md font-medium transition-colors ' +
    'focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ';
  const classes = [base, variantClasses[variant], sizeClasses[size], className].join(' ');
  return (
    <button className={classes} {...rest}>
      {' '}
      {children}{' '}
    </button>
  );
};
export default Button;
