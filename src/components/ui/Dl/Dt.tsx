import type { ComponentProps } from 'react';

export type DtProps = ComponentProps<'dt'>;

const Dt = (props: DtProps) => {
  const { children, className, ...rest } = props;
  return (
    <dt
      className={`
        font-bold
        group-data-[marker=bullet]/dl:ml-8
        group-data-[marker=bullet]/dl:list-item
        group-data-[marker=bullet]/dl:list-disc
        ${className ?? ''}
      `}
      {...rest}
    >
      {children}
    </dt>
  );
};

export default Dt;
