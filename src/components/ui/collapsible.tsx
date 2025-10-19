// src/components/ui/collapsible.tsx
import React from 'react';

interface CollapsibleProps {
  open?: boolean;
  onOpenChange?: (_open: boolean) => void;
  children: React.ReactNode;
  className?: string;
}

interface CollapsibleContentProps {
  children: React.ReactNode;
  className?: string;
}

const Collapsible: React.FC<CollapsibleProps> = ({
  open: _open,
  onOpenChange: _onOpenChange,
  children,
  className,
}) => {
  return <div className={className}>{children}</div>;
};

const CollapsibleTrigger: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  return <div className={className}>{children}</div>;
};

const CollapsibleContent: React.FC<CollapsibleContentProps> = ({ children, className }) => {
  return <div className={className}>{children}</div>;
};

export { Collapsible, CollapsibleTrigger, CollapsibleContent };
