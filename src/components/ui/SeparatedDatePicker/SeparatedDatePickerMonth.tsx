import { type ComponentProps, forwardRef } from 'react';

export type SeparatedDatePickerMonthProps = ComponentProps<'input'> & {};

const SeparatedDatePickerMonth = forwardRef<
  HTMLInputElement,
  SeparatedDatePickerMonthProps
>((props, ref) => {
  const { className, 'aria-disabled': disabled, readOnly, ...rest } = props;

  return (
    <label
      className={`
        relative
        [&:has([aria-disabled="true"])]:pointer-events-none
      `}
    >
      <span
        className={`
          text-oln-16N-100 absolute inset-x-0 -top-3 mx-auto w-6 bg-white p-1
          [&:has(+[aria-disabled=true])]:text-solid-gray-420
          forced-colors:[&:has(+[aria-disabled=true])]:text-[GrayText]
        `}
      >
        月
      </span>
      <input
        className={`
          rounded-8 h-full w-14 border border-solid-gray-600 bg-white
          text-center
          hover:border-solid-gray-900 hover:read-only:border-solid-gray-600
          focus:border-solid-gray-900 focus:ring-[calc(2/16*1rem)]
          focus:ring-yellow-300 focus:outline-4
          focus:outline-offset-[calc(2/16*1rem)] focus:outline-black
          focus:outline-solid
          aria-disabled:bg-solid-gray-50 aria-disabled:text-solid-gray-420
          aria-disabled:hover:border-solid-gray-600
          aria-invalid:border-error-1 aria-invalid:hover:border-red-1000
          read-only:[&:not([aria-disabled="true"])]:border-dashed
          forced-colors:[&:read-write]:aria-disabled:border-[GrayText]
          ${className ?? ''}
        `}
        type="text"
        inputMode="numeric"
        pattern="\d+"
        readOnly={disabled ? true : readOnly}
        aria-disabled={disabled}
        ref={ref}
        {...rest}
      />
    </label>
  );
});

SeparatedDatePickerMonth.displayName = 'SeparatedDatePickerMonth';

export default SeparatedDatePickerMonth;
