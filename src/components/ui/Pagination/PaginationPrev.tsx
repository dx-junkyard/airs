import type { ComponentProps } from 'react';
import { paginationItemStyle } from '@/components/ui/Pagination/Pagination';

export type PaginationPrevProps = ComponentProps<'button'>;

const PaginationPrev = (props: PaginationPrevProps) => {
  const { className, 'aria-label': ariaLabel, ...rest } = props;
  return (
    <button
      type="button"
      aria-label={ariaLabel ?? '前のページへ戻る'}
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
          d="M15.33 19L16 18.33L9.67 12L16 5.67L15.33 5L8.33 12L15.33 19Z"
          fill="#1A3EE8"
        />
      </svg>
    </button>
  );
};

export default PaginationPrev;
