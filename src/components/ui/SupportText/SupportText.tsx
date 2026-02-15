import type { ComponentProps } from 'react';

export type SupportTextProps = ComponentProps<'p'>;

const SupportText = (props: SupportTextProps) => {
  const { children, className, ...rest } = props;

  return (
    <p
      className={`
        text-std-16N-170 text-solid-gray-600
        ${className ?? ''}
      `}
      {...rest}
    >
      {children}
    </p>
  );
};

export default SupportText;
