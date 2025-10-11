import React from 'react';
interface CheckboxProps {
  id?: string;
  checked?: boolean;
  onCheckedChange?: (_checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}
const Checkbox: React.FC<CheckboxProps> = ({
  id,
  _checked = false,
  _onCheckedChange,
  _disabled = false,
  _className = '',
}) => {
  return (
    <input
      id={id}
      type="checkbox"
      checked={checked}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
      disabled={disabled}
      className={`h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 ${className}`}
    />
  );
};
export { Checkbox };
