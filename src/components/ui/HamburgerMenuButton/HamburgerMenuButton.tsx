import { type ComponentProps, forwardRef } from 'react';

export type HamburgerMenuButtonProps = ComponentProps<'button'>;

const HamburgerMenuButton = forwardRef<
  HTMLButtonElement,
  HamburgerMenuButtonProps
>((props, ref) => {
  const { children, className, ...rest } = props;

  return (
    <button
      className={`
        rounded-6 text-oln-16N-100 flex w-fit touch-manipulation items-center
        gap-x-1 px-3 pt-1 pb-1.5
        hover:bg-solid-gray-50 hover:underline
        hover:underline-offset-[calc(3/16*1rem)]
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

HamburgerMenuButton.displayName = 'HamburgerMenuButton';

export default HamburgerMenuButton;
