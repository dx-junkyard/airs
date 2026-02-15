import type { ComponentProps } from 'react';

export type DisclosureProps = ComponentProps<'details'>;

const Disclosure = (props: DisclosureProps) => {
  const { children, className, ...rest } = props;

  return (
    <details
      className={`
        group/disclosure
        ${className ?? ''}
      `}
      {...rest}
    >
      {children}
    </details>
  );
};

export default Disclosure;
