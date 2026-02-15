import type { ComponentProps } from 'react';

export type PaginationEllipsisProps = ComponentProps<'svg'>;

const PaginationEllipsis = (props: PaginationEllipsisProps) => {
  const { className, ...rest } = props;
  return (
    <svg
      aria-hidden={true}
      className={className}
      fill="none"
      height="24"
      role="img"
      viewBox="0 0 24 24"
      width="24"
      {...rest}
    >
      <circle className="fill-blue-900" cx="6" cy="12" r="1" />
      <circle className="fill-blue-900" cx="12" cy="12" r="1" />
      <circle className="fill-blue-900" cx="18" cy="12" r="1" />
    </svg>
  );
};

export default PaginationEllipsis;
