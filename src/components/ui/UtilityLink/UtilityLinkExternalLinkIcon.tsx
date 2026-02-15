import type { ComponentProps } from 'react';

export type UtilityLinkExternalLinkIconProps = ComponentProps<'svg'>;

const UtilityLinkExternalLinkIcon = (
  props: UtilityLinkExternalLinkIconProps
) => {
  const { className, ...rest } = props;

  return (
    <svg
      aria-label={`${rest['aria-label'] ?? '新規タブで開きます'}`}
      role="img"
      className={`
        ml-1 inline-block align-[-0.15em]
        ${className ?? ''}
      `}
      fill="none"
      height="16"
      viewBox="0 0 48 48"
      width="16"
    >
      <path
        className={className ?? ''}
        d="M22 6V9H9V39H39V26H42V42H6V6H22ZM42 6V20H39V11.2L21 29L19 27L36.8 9H28V6H42Z"
        fill="currentColor"
      />
    </svg>
  );
};

export default UtilityLinkExternalLinkIcon;
