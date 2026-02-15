import type { ComponentProps } from 'react';
import { paginationItemStyle } from '@/components/ui/Pagination/Pagination';

export type PaginationLastProps = ComponentProps<'button'>;

const PaginationLast = (props: PaginationLastProps) => {
  const { className, 'aria-label': ariaLabel, ...rest } = props;
  return (
    <button
      type="button"
      aria-label={ariaLabel ?? '最後のページに移動する'}
      className={`
        ${paginationItemStyle}
        ${className}
      `}
      {...rest}
    >
      <svg
        aria-hidden={true}
        className="-scale-x-100"
        fill="none"
        height="24"
        viewBox="0 0 24 24"
        width="24"
      >
        <path
          className="fill-blue-900"
          d="M18.33 19L19 18.33L12.67 12L19 5.67L18.33 5L11.33 12L18.33 19Z"
        />
        <rect
          className="fill-blue-900"
          height="14"
          transform="matrix(1, 8.74228e-08, 8.74228e-08, -1, 6, 19)"
          width="1"
        />
      </svg>
    </button>
  );
};

export default PaginationLast;
