import type { ComponentProps } from 'react';
import { paginationItemStyle } from '@/components/ui/Pagination/Pagination';

export type PaginationItemProps = ComponentProps<'a'>;

const PaginationItem = (props: PaginationItemProps) => {
  const { children, className, ...rest } = props;

  return (
    <a
      className={`
        ${paginationItemStyle}
        ${className}
      `}
      {...rest}
    >
      {children}
    </a>
  );
};

export default PaginationItem;
