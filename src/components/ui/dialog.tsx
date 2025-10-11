import * as React from 'react';
type Props = React.HTMLAttributes<HTMLDivElement> & {
  open?: boolean;
  onOpenChange?: (_v: boolean) => void;
};
export const Dialog: React.FC<Props> = ({
  open,
  _onOpenChange: _onOpenChange,
  _children,
  ...rest
}) => (
  <div role="dialog" aria-modal="true" hidden={!open} {...rest}>
    {' '}
    {children}{' '}
  </div>
);
export default Dialog;
