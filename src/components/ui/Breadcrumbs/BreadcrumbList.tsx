import type { ComponentProps } from 'react';

export type BreadcrumbListProps = ComponentProps<'ol'>;

const BreadcrumbList = (props: BreadcrumbListProps) => {
  const { children, className, ...rest } = props;

  return (
    <ol
      className={`
        inline
        ${className ?? ''}
      `}
      {...rest}
    >
      {children}
    </ol>
  );
};

export default BreadcrumbList;
