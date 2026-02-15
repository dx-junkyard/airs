import type { ComponentProps } from 'react';

export type DdProps = ComponentProps<'dd'>;

const Dd = (props: DdProps) => {
  const { children, className, ...rest } = props;
  return (
    <dd
      className={`
        ml-8
        ${className ?? ''}
      `}
      {...rest}
    >
      {children}
    </dd>
  );
};

export default Dd;
