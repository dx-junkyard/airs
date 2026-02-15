import type { ComponentProps } from 'react';

export type BreadcrumbsLabelProps = ComponentProps<'span'>;

const BreadcrumbsLabel = (props: BreadcrumbsLabelProps) => {
  const { children, className, ...rest } = props;

  return (
    <span
      className={`
        ${className ?? ''}
      `}
      {...rest}
    >
      {children}
    </span>
  );
};

export default BreadcrumbsLabel;
