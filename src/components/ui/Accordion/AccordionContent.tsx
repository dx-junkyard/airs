import type { ComponentProps } from 'react';

export type AccordionContentProps = ComponentProps<'div'>;

const AccordionContent = (props: AccordionContentProps) => {
  const { children, className, ...rest } = props;
  return (
    <div
      className={`
        desktop:pl-[calc(var(--icon-size)+(20/16*1rem))] desktop:pr-4
        desktop:py-6
        py-4 pr-2 pl-[calc(var(--icon-size)+(12/16*1rem))]
        ${className ?? ''}
      `}
      {...rest}
    >
      {children}
    </div>
  );
};

export default AccordionContent;
