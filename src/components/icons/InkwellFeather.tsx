// src/components/icons/InkwellFeather.tsx
import { forwardRef } from 'react';

import type { LucideProps } from 'lucide-react';

type FeatherProps = Omit<LucideProps, 'ref'> & { title?: string };

const InkwellFeather = forwardRef<SVGSVGElement, FeatherProps>(({ title, ...props }, ref) => {
  return (
    <svg ref={ref} {...props} role="img" aria-label={title}>
      {title ? <title>{title}</title> : null}
      {/* ...paths... */}
    </svg>
  );
});

export default InkwellFeather;
