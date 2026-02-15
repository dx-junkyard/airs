import type { ComponentProps } from 'react';

export type DlProps = ComponentProps<'dl'> & {
  marker?: 'none' | 'bullet';
};

const Dl = (props: DlProps) => {
  const { children, className, marker, ...rest } = props;
  return (
    <dl
      className={`
        group/dl grid gap-y-2
        ${className ?? ''}
      `}
      data-marker={marker}
      {...rest}
    >
      {children}
    </dl>
  );
};

export default Dl;
