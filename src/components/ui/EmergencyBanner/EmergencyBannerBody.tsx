import type { ComponentProps } from 'react';

export type EmergencyBannerBodyProps = ComponentProps<'div'>;

const EmergencyBannerBody = (props: EmergencyBannerBodyProps) => {
  const { className, children } = props;

  return (
    <div
      className={`
        desktop:mt-4
        mt-2
        ${className ?? ''}
      `}
    >
      {children}
    </div>
  );
};

export default EmergencyBannerBody;
