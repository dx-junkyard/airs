import type { ComponentProps } from 'react';

export type AccordionSummaryProps = ComponentProps<'summary'>;

const AccordionSummary = (props: AccordionSummaryProps) => {
  const { children, className, ...rest } = props;

  return (
    <summary
      className={`
        group/summary
        desktop:py-3.5 desktop:pl-[calc(var(--icon-size)+(20/16*1rem))]
        desktop:pr-4
        relative block cursor-default py-2 pr-2
        pl-[calc(var(--icon-size)+(12/16*1rem))]
        focus-visible:rounded-4 focus-visible:bg-yellow-300
        focus-visible:ring-[calc(2/16*1rem)] focus-visible:ring-yellow-300
        focus-visible:outline-4 focus-visible:outline-offset-[calc(2/16*1rem)]
        focus-visible:outline-black focus-visible:outline-solid
        marker:[content:'']
        hover:bg-solid-gray-50
        [&::-webkit-details-marker]:hidden
        ${className ?? ''}
      `}
      {...rest}
    >
      <span
        className={`
          desktop:left-4
          absolute top-1/2 left-2 inline-flex size-(--icon-size)
          -translate-y-1/2 items-center justify-center rounded-full border
          border-current bg-white text-blue-1000
          group-open/accordion:rotate-180
          group-hover/summary:outline-2 group-hover/summary:outline-current
          group-hover/summary:outline-solid
        `}
      >
        <svg
          aria-hidden={true}
          className={`
            desktop:size-auto
            pointer-events-none mt-0.5 size-4
          `}
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
        >
          <g>
            <path
              d="M16.668 5.5L10.0013 12.1667L3.33464 5.5L2.16797 6.66667L10.0013 14.5L17.8346 6.66667L16.668 5.5Z"
              fill="currentColor"
            />
          </g>
        </svg>
      </span>
      {children}
    </summary>
  );
};

export default AccordionSummary;
