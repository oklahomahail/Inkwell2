// src/components/ui/Icon.tsx
// Simple icon adapter that wraps lucide-react for flexibility
import * as L from 'lucide-react';
import React from 'react';

// Export lucide icon names for type safety
export type IconName = keyof typeof L;

// Icon component props
export interface IconProps extends React.SVGProps<SVGSVGElement> {
  name: IconName;
}

/**
 * Icon component that wraps lucide-react icons
 * Provides a single interface for all icons in the app
 * Can be easily swapped to a different icon library if needed
 */
export function Icon({ name, ...props }: IconProps) {
  const IconComponent = L[name] as React.ComponentType<React.SVGProps<SVGSVGElement>>;
  
  if (!IconComponent) {
    console.warn(`Icon "${String(name)}" not found in lucide-react`);
    return null;
  }
  
  return <IconComponent {...props} />;
}

// Re-export lucide-react for direct usage where the adapter isn't needed
export * from 'lucide-react';

export default Icon;