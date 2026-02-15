import type { ComponentProps } from 'react';

export const paginationItemStyle = `
  flex h-12 w-12 items-center justify-center rounded-full border border-solid-gray-200 text-oln-16N-100 text-blue-1000
  hover:border-blue-900 hover:bg-blue-50
  focus-visible:outline-2 focus-visible:outline-focus-yellow
  active:border-blue-900 active:bg-blue-50
  disabled:pointer-events-none disabled:opacity-50
`;

export type PaginationProps = ComponentProps<'nav'>;

/**
 * ※ Pagination は v1 のみのコンポーネントのため、v2 では非推奨となっています。
 */
const Pagination = (props: PaginationProps) => {
  const { children, className, ...rest } = props;
  return (
    <nav
      aria-label={`${rest['aria-label'] ?? 'ページナビゲーション'}`}
      className={`
        flex flex-wrap items-center gap-3
        ${className ?? ''}
      `}
      {...rest}
    >
      {children}
    </nav>
  );
};

export default Pagination;
