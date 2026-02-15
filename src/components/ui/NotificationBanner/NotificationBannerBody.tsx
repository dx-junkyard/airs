import type { ComponentProps } from 'react';

export type NotificationBannerBodyProps = ComponentProps<'div'>;

const NotificationBannerBody = (props: NotificationBannerBodyProps) => {
  const { className, children, ...rest } = props;

  return (
    <div
      className={`
        desktop:col-start-2
        text-std-16N-170 col-start-1 -col-end-1 grid gap-y-2 text-solid-gray-800
        ${className ?? ''}
      `}
      {...rest}
    >
      {children}
    </div>
  );
};

export default NotificationBannerBody;
