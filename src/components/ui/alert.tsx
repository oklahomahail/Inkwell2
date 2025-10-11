import React from 'react';
interface AlertProps {
  children: React.ReactNode;
  variant?: 'default' | 'warning' | 'error' | 'success';
  className?: string;
}
interface AlertDescriptionProps {
  children: React.ReactNode;
  className?: string;
}
export function _Alert({ children, variant = 'default', className = '' }: AlertProps) {
  const variantStyles = {
    default: 'border-gray-200 bg-gray-50 text-gray-700',
    warning: 'border-yellow-200 bg-yellow-50 text-yellow-800',
    error: 'border-red-200 bg-red-50 text-red-800',
    success: 'border-green-200 bg-green-50 text-green-800',
  };
  return (
    <div className={`border rounded-lg p-4 ${variantStyles[variant]} ${className}`}>{children}</div>
  );
}
export function _AlertDescription({ children, className = '' }: AlertDescriptionProps) {
  return <div className={`text-sm ${className}`}>{children}</div>;
}
