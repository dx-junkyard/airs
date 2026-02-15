import { type ComponentProps, forwardRef } from 'react';

export type HamburgerMenuIconButtonProps = ComponentProps<'button'>;

const HamburgerMenuIconButton = forwardRef<
  HTMLButtonElement,
  HamburgerMenuIconButtonProps
>((props, ref) => {
  const { children, className, ...rest } = props;

  return (
    <button
      className={`
        rounded-4 block w-fit touch-manipulation p-0 text-black
        hover:bg-solid-gray-50 hover:outline-1
        focus-visible:bg-yellow-300 focus-visible:ring-[calc(2/16*1rem)]
        focus-visible:ring-yellow-300 focus-visible:outline-4
        focus-visible:outline-offset-[calc(2/16*1rem)]
        focus-visible:outline-black focus-visible:outline-solid
        ${className ?? ''}
      `}
      ref={ref}
      type="button"
      {...rest}
    >
      {children}
    </button>
  );
});

HamburgerMenuIconButton.displayName = 'HamburgerMenuIconButton';

export default HamburgerMenuIconButton;
