import type { ComponentProps } from 'react';

export type DividerColor = 'gray-420' | 'gray-536' | 'black';

export type DividerProps = ComponentProps<'hr'> & {
  color?: DividerColor;
};

const Divider = (props: DividerProps) => {
  const { className, color = 'gray-420', ...rest } = props;

  return (
    <hr
      className={`
        data-[color=black]:border-black
        data-[color=gray-420]:border-solid-gray-420
        data-[color=gray-536]:border-solid-gray-536
        ${className ?? ''}
      `}
      data-color={color}
      {...rest}
    ></hr>
  );
};

export default Divider;
