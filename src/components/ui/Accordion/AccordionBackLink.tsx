import type { ComponentProps } from 'react';

export type AccordionBackLinkProps = ComponentProps<'a'>;

const AccordionBackLink = (props: AccordionBackLinkProps) => {
  const { className, children, href, ...rest } = props;

  return (
    <a
      className={`
        focus-visible:rounded-4 focus-visible:bg-yellow-300
        focus-visible:text-blue-1000 focus-visible:ring-[calc(2/16*1rem)]
        focus-visible:ring-yellow-300 focus-visible:outline-4
        focus-visible:outline-offset-[calc(2/16*1rem)]
        focus-visible:outline-black focus-visible:outline-solid
        flex w-fit items-start gap-1.5 text-blue-1000 underline
        underline-offset-[calc(3/16*1rem)]
        hover:text-blue-1000 hover:decoration-[calc(3/16*1rem)]
        active:text-orange-800 active:decoration-1
        ${className ?? ''}
      `}
      href={href}
      {...rest}
    >
      <svg
        aria-hidden={true}
        className="mt-[calc((1lh-24px)/2)] shrink-0"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
      >
        <g>
          <path
            d="M5 7L7 7L7 14.1C7 15.15 7.33333 16.0625 8 16.8375C8.66667 17.6125 9.5 18 10.5 18C11.5 18 12.3333 17.6125 13 16.8375C13.6667 16.0625 14 15.15 14 14.1L14 7.8L11.4 10.4L10 9L15 4L20 9L18.6 10.4L16 7.8V14.1C16 15.7167 15.475 17.1042 14.425 18.2625C13.375 19.4208 12.0667 20 10.5 20C8.93333 20 7.625 19.4208 6.575 18.2625C5.525 17.1042 5 15.7167 5 14.1L5 7Z"
            fill="currentColor"
          />
        </g>
      </svg>
      {children}
    </a>
  );
};

export default AccordionBackLink;
