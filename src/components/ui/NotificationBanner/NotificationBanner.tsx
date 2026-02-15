import type { ReactNode } from 'react';
import NotificationBannerIcon from './NotificationBannerIcon';
import { bannerStyleClasses, bannerTypeClasses } from './styles';
import type {
  NotificationBannerHeadingLevel,
  NotificationBannerStyle,
  NotificationBannerType,
} from './types';

export type NotificationBannerProps = {
  className?: string;
  children: ReactNode;
  bannerStyle: NotificationBannerStyle;
  type: NotificationBannerType;
  title: string;
  headingLevel?: NotificationBannerHeadingLevel;
};

const NotificationBanner = (props: NotificationBannerProps) => {
  const { className, children, bannerStyle, type, title, headingLevel } = props;
  const Tag = headingLevel ?? 'div';

  return (
    <div
      className={`
        desktop:gap-x-6 desktop:px-6 desktop:pt-6 desktop:pb-8
        desktop:[--icon-size:calc(36/16*1rem)]
        grid grid-cols-[var(--icon-size)_1fr_minmax(0,auto)]
        grid-rows-[minmax(calc(36/16*1rem),auto)] gap-4 border-current px-4 pt-2
        pb-6
        [--icon-size:calc(24/16*1rem)]
        ${bannerStyleClasses}
        ${bannerTypeClasses}
        ${className ?? ''}
      `}
      data-type={type}
      data-style={bannerStyle}
    >
      <Tag className={`col-span-2 grid grid-cols-[inherit] gap-[inherit]`}>
        <NotificationBannerIcon
          className={`
            desktop:size-11 desktop:-my-1
            mt-[calc(3/16*1rem)] size-7 max-h-none max-w-none
            justify-self-center
          `}
          type={type}
        />
        <span
          className={`
            text-std-17B-170
            desktop:text-std-20B-150 desktop:pt-0.5
            pt-[calc(3/16*1rem)] text-solid-gray-900
          `}
        >
          {title}
        </span>
      </Tag>
      {children}
    </div>
  );
};

export default NotificationBanner;
