import * as React from 'react';
type Props = React.HTMLAttributes<HTMLDivElement> & {
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
};
export const Dialog: React.FC<Props> = ({
  open,
  onOpenChange: _onOpenChange,
  children,
  ...rest
}) => (
  <div role="dialog" aria-modal="true" hidden={!open} {...rest}>
    {children}
  </div>
);
export default Dialog;
