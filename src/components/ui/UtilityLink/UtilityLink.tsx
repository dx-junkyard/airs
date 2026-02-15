import type { ComponentProps } from 'react';
import Slot from '@/components/ui/Slot/Slot';
import UtilityLinkExternalLinkIcon, {
  type UtilityLinkExternalLinkIconProps,
} from './UtilityLinkExternalLinkIcon';

export const utilityLinkStyle = `!text-solid-gray-800 text-dns-16N-130 underline underline-offset-[calc(3/16*1rem)]
  hover:decoration-[calc(3/16*1rem)]
  focus-visible:rounded-4 focus-visible:outline-solid focus-visible:outline-4 focus-visible:outline-black focus-visible:outline-offset-[calc(2/16*1rem)] focus-visible:bg-yellow-300 focus-visible:text-blue-1000 focus-visible:ring-[calc(2/16*1rem)] focus-visible:ring-yellow-300`;

export type UtilityLinkProps = {
  className?: string;
  icon?: UtilityLinkExternalLinkIconProps;
} & (
  | ({ asChild?: false } & ComponentProps<'a'>)
  | { asChild: true; children: React.ReactNode }
);

const UtilityLink = (props: UtilityLinkProps) => {
  const { asChild, children, className, icon, ...rest } = props;

  if (asChild) {
    return (
      <Slot
        className={`
          ${utilityLinkStyle}
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
        ${utilityLinkStyle}
        ${className ?? ''}
      `}
      {...rest}
    >
      {children}

      {props.target === '_blank' && <UtilityLinkExternalLinkIcon {...icon} />}
    </a>
  );
};

export default UtilityLink;
