import React, { useState, useRef, useEffect } from 'react';

interface PopoverProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

interface PopoverContentProps {
  children: React.ReactNode;
  className?: string;
  align?: 'start' | 'center' | 'end';
  side?: 'top' | 'bottom' | 'left' | 'right';
}

interface PopoverTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
}

const PopoverContext = React.createContext<{
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLElement>;
}>({
  isOpen: false,
  setIsOpen: () => {},
  triggerRef: { current: null },
});

export const Popover: React.FC<PopoverProps> = ({ open, onOpenChange, children }) => {
  const [isOpen, setIsOpen] = useState(open ?? false);
  const triggerRef = useRef<HTMLElement>(null);

  const handleOpenChange = (newOpen: boolean) => {
    setIsOpen(newOpen);
    onOpenChange?.(newOpen);
  };

  useEffect(() => {
    if (open !== undefined) {
      setIsOpen(open);
    }
  }, [open]);

  return (
    <PopoverContext.Provider value={{ isOpen, setIsOpen: handleOpenChange, triggerRef }}>
      {children}
    </PopoverContext.Provider>
  );
};

export const PopoverTrigger: React.FC<PopoverTriggerProps> = ({ children, asChild }) => {
  const { isOpen, setIsOpen, triggerRef } = React.useContext(PopoverContext);

  const handleClick = () => {
    setIsOpen(!isOpen);
  };

  if (asChild) {
    return React.cloneElement(children as React.ReactElement, {
      ref: triggerRef,
      onClick: handleClick,
    });
  }

  return (
    <button ref={triggerRef as any} onClick={handleClick}>
      {children}
    </button>
  );
};

export const PopoverContent: React.FC<PopoverContentProps> = ({
  children,
  className = '',
  align = 'center',
  side = 'bottom',
}) => {
  const { isOpen, setIsOpen } = React.useContext(PopoverContext);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contentRef.current && !contentRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, setIsOpen]);

  if (!isOpen) return null;

  const alignmentClasses = {
    start: 'left-0',
    center: 'left-1/2 -translate-x-1/2',
    end: 'right-0',
  };

  const sideClasses = {
    bottom: 'top-full mt-2',
    top: 'bottom-full mb-2',
    left: 'right-full mr-2',
    right: 'left-full ml-2',
  };

  return (
    <div
      ref={contentRef}
      className={`absolute z-50 bg-white border border-gray-200 rounded-lg shadow-lg ${alignmentClasses[align]} ${sideClasses[side]} ${className}`}
    >
      {children}
    </div>
  );
};
