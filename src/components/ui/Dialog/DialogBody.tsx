import type { ComponentProps } from 'react';

export type DialogBodyProps = ComponentProps<'div'>;

const DialogBody = (props: DialogBodyProps) => {
  const { children, className, ...rest } = props;
  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: light dismiss for v1 only
    // biome-ignore lint/a11y/useKeyWithClickEvents: light dismiss for v1 only
    <div
      className={`
        rounded-12
        desktop:p-10
        flex flex-col items-center gap-4 border border-solid-gray-200 bg-white
        p-6
        ${className ?? ''}
      `}
      onClick={(e) => {
        e.stopPropagation();
      }}
      {...rest}
    >
      {children}
    </div>
  );
};

export default DialogBody;
