import type { ComponentProps } from 'react';

type Props = ComponentProps<'blockquote'>;

const Blockquote = (props: Props) => {
  const { children, className, ...rest } = props;
  return (
    <blockquote
      className={`
        mx-10 border-l-8 border-solid-gray-536 py-2 pr-4 pl-6
        [&>*:first-child]:mt-0! [&>*:last-child]:mb-0!
        ${className ?? ''}
      `}
      {...rest}
    >
      {children}
    </blockquote>
  );
};

export default Blockquote;
