import type { ComponentProps } from 'react';

export const ulStyle = 'pl-8 list-[revert]';
export const ulUnstyledStyle = 'list-none pl-0';

export type UlProps = ComponentProps<'ul'> & {
  unstyled?: boolean;
};

const Ul = (props: UlProps) => {
  const { children, className, unstyled = false, ...rest } = props;

  const baseStyle = unstyled ? ulUnstyledStyle : ulStyle;

  return (
    <ul
      className={`
        ${baseStyle}
        ${className ?? ''}
      `}
      {...rest}
    >
      {children}
    </ul>
  );
};

export default Ul;
