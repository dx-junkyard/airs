import type { ComponentProps } from 'react';
import { paginationItemStyle } from '@/components/ui/Pagination/Pagination';

export type PaginationNextProps = ComponentProps<'button'>;

const PaginationNext = (props: PaginationNextProps) => {
  const { className, 'aria-label': ariaLabel, ...rest } = props;
  return (
    <button
      type="button"
      aria-label={ariaLabel ?? '次のページへ進む'}
      className={`
        ${paginationItemStyle}
        ${className}
      `}
      {...rest}
    >
      <svg
        aria-hidden={true}
        fill="none"
        height="24"
        viewBox="0 0 24 24"
        width="24"
      >
        <path
          className="fill-blue-900"
          d="M8.67 19L8 18.33L14.33 12L8 5.67L8.67 5L15.67 12L8.67 19Z"
        />
      </svg>
    </button>
  );
};

export default PaginationNext;
