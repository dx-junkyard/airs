import type { ComponentProps } from 'react';

export type BreadcrumbItemProps = ComponentProps<'li'> & {
  isCurrent?: boolean;
};

const BreadcrumbItem = ({
  isCurrent = false,
  children,
  className,
  ...rest
}: BreadcrumbItemProps) => {
  if (isCurrent) {
    return (
      <li
        aria-current="page"
        className={`
          text-oln-16N-100 inline break-words
          ${className ?? ''}
        `}
        {...rest}
      >
        {children}
      </li>
    );
  }
  return (
    <li
      className={`
        inline break-words
        ${className ?? ''}
      `}
    >
      {children}
      <svg
        aria-hidden={true}
        className="mx-2 inline"
        fill="none"
        height="12"
        viewBox="0 0 12 12"
        width="12"
      >
        <path
          d="M4.50078 1.2998L3.80078 1.9998L7.80078 5.9998L3.80078 9.9998L4.50078 10.6998L9.20078 5.9998L4.50078 1.2998Z"
          fill="currentColor"
        />
      </svg>
    </li>
  );
};

export default BreadcrumbItem;
