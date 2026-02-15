import { type ComponentProps, forwardRef } from 'react';

export type DatePickerYearProps = ComponentProps<'input'> & {};

const DatePickerYear = forwardRef<HTMLInputElement, DatePickerYearProps>(
  (props, ref) => {
    const {
      className,
      'aria-disabled': ariaDisabled,
      readOnly,
      ...rest
    } = props;

    return (
      <label
        className={`
          relative z-0 inline-flex flex-row-reverse
          last:pe-4
          [&:has([aria-disabled="true"])]:pointer-events-none
        `}
      >
        <span
          className={`text-oln-16N-100 relative z-10 self-center bg-(--bg) p-1`}
        >
          年
        </span>
        <input
          className={`
            rounded-8 -me-1 w-16 border border-transparent bg-transparent pe-3
            text-right
            focus:border-solid-gray-600 focus:ring-[calc(2/16*1rem)]
            focus:ring-yellow-300 focus:outline-4
            focus:outline-offset-[calc(2/16*1rem)] focus:outline-black
            focus:outline-solid
            aria-disabled:pointer-events-none
            forced-colors:border-[Canvas]
            forced-colors:aria-disabled:focus:border-[GrayText]
            ${className ?? ''}
          `}
          type="text"
          inputMode="numeric"
          pattern="\d+"
          readOnly={
            ariaDisabled === 'true' || ariaDisabled === true || readOnly
          }
          aria-disabled={ariaDisabled}
          ref={ref}
          {...rest}
        />
      </label>
    );
  }
);

DatePickerYear.displayName = 'DatePickerYear';

export default DatePickerYear;
