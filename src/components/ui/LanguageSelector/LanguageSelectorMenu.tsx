import { type ComponentProps, forwardRef } from 'react';

export type LanguageSelectorMenuProps = ComponentProps<'ul'> & {
  isCondensed?: boolean;
};

const LanguageSelectorMenu = forwardRef<
  HTMLUListElement,
  LanguageSelectorMenuProps
>((props, ref) => {
  const { children, className, isCondensed, ...rest } = props;

  return (
    <ul
      className={`
        shadow-1 rounded-8 w-auto min-w-fit border border-solid-gray-420
        bg-white py-2
        has-[>:nth-child(7)]:rounded-r-none
        ${
          isCondensed
            ? 'max-h-[calc((36*6.5+16)/16*1rem)]'
            : `max-h-[calc((44*6.5+16)/16*1rem)]`
        }
        ${className ?? ''}
      `}
      ref={ref}
      {...rest}
    >
      {children}
    </ul>
  );
});

LanguageSelectorMenu.displayName = 'LanguageSelectorMenu';

export default LanguageSelectorMenu;
