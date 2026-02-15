import { type ComponentProps, forwardRef } from 'react';

export type LanguageSelectorButtonProps = ComponentProps<'button'>;

const LanguageSelectorButton = forwardRef<
  HTMLButtonElement,
  LanguageSelectorButtonProps
>((props, ref) => {
  const { children, className, ...rest } = props;

  return (
    <button
      className={`
        text-oln-16N-100 rounded-8 flex min-h-[calc(44/16*1rem)] w-fit
        items-center gap-1 text-solid-gray-800
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

LanguageSelectorButton.displayName = 'LanguageSelectorButton';

export default LanguageSelectorButton;
