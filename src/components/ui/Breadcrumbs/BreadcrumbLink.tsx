import type { ComponentProps } from 'react';
import Slot from '@/components/ui/Slot/Slot';

export const breadcrumbLinkStyle = `
  text-blue-1000 text-oln-16N-100 underline underline-offset-[calc(3/16*1rem)]
  hover:text-blue-900 hover:decoration-[calc(3/16*1rem)]
  active:text-orange-800 active:decoration-1
  focus-visible:rounded-4 focus-visible:outline-solid focus-visible:outline-4 focus-visible:outline-black focus-visible:outline-offset-[calc(2/16*1rem)] focus-visible:bg-yellow-300 focus-visible:text-blue-1000 focus-visible:ring-[calc(2/16*1rem)] focus-visible:ring-yellow-300
`;

export type BreadcrumbLinkProps = {
  className?: string;
} & (
  | ({ asChild?: false } & ComponentProps<'a'>)
  | { asChild: true; children: React.ReactNode }
);

const BreadcrumbLink = (props: BreadcrumbLinkProps) => {
  const { asChild, children, className, ...rest } = props;

  if (asChild) {
    return (
      <Slot
        className={`
          ${breadcrumbLinkStyle}
          ${className ?? ''}
        `}
        {...rest}
      >
        {children}
      </Slot>
    );
  }

  return (
    <a
      className={`
        ${breadcrumbLinkStyle}
        ${className ?? ''}
      `}
      {...rest}
    >
      {children}
    </a>
  );
};

export default BreadcrumbLink;
