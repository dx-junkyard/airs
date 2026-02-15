import type { ComponentProps } from 'react';

export type AccordionProps = ComponentProps<'details'>;

const Accordion = (props: AccordionProps) => {
  const { children, className, ...rest } = props;

  return (
    <details
      className={`
        group/accordion
        desktop:[--icon-size:calc(32/16*1rem)]
        border-b border-solid-gray-420
        [--icon-size:calc(20/16*1rem)]
        ${className ?? ''}
      `}
      {...rest}
    >
      {children}
    </details>
  );
};

export default Accordion;
