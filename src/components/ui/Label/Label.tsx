import type { ComponentProps } from 'react';

export type LabelSize = 'lg' | 'md' | 'sm';

export type LabelProps = ComponentProps<'label'> & {
  size?: LabelSize;
};

const Label = (props: LabelProps) => {
  const { children, className, size = 'md', ...rest } = props;

  return (
    <label
      className={`
        data-[size=sm]:text-std-16B-170
        data-[size=md]:text-std-17B-170
        data-[size=lg]:text-std-18B-160
        text-solid-gray-800
        ${className ?? ''}
      `}
      data-size={size}
      {...rest}
    >
      {children}
    </label>
  );
};

export default Label;
