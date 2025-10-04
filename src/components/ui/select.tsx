// src/components/ui/select.tsx
import { ChevronDown } from 'lucide-react';
import React from 'react';

interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  disabled?: boolean;
  placeholder?: string;
}

interface SelectTriggerProps {
  children: React.ReactNode;
  className?: string;
}

interface SelectContentProps {
  children: React.ReactNode;
  className?: string;
}

interface SelectItemProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

interface SelectValueProps {
  placeholder?: string;
}

const Select: React.FC<SelectProps> = ({
  value: _value,
  onValueChange: _onValueChange,
  children,
}) => {
  return <div className="relative">{children}</div>;
};

const SelectTrigger: React.FC<SelectTriggerProps> = ({ children, className }) => {
  return (
    <button
      className={`flex items-center justify-between w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white hover:bg-gray-50 ${className}`}
    >
      {children}
      <ChevronDown className="h-4 w-4 opacity-50" />
    </button>
  );
};

const SelectContent: React.FC<SelectContentProps> = ({ children }) => {
  return (
    <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg">
      {children}
    </div>
  );
};

const SelectItem: React.FC<SelectItemProps> = ({ children, className }) => {
  return (
    <div className={`px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer ${className}`}>
      {children}
    </div>
  );
};

const SelectValue: React.FC<SelectValueProps> = ({ placeholder }) => {
  return <span className="text-gray-500">{placeholder}</span>;
};

export { Select, SelectTrigger, SelectContent, SelectItem, SelectValue };
