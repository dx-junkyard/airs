import type { ComponentProps } from 'react';

export type BreadcrumbsProps = ComponentProps<'nav'>;

const Breadcrumbs = (props: BreadcrumbsProps) => {
  const { children, className, ...rest } = props;

  return (
    <nav
      className={`
        ${className ?? ''}
      `}
      {...rest}
    >
      {children}
    </nav>
  );
};

export default Breadcrumbs;
