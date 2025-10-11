import * as React from 'react';
export const ScrollArea: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  ...rest
}) => (
  <div style={{ maxHeight: '60vh', overflowY: 'auto' }} {...rest}>
    {' '}
    {children}{' '}
  </div>
);
export default ScrollArea;
