import { forwardRef, type ComponentProps } from 'react';

export type LanguageSelectorProps = ComponentProps<'div'>;

const LanguageSelector = forwardRef<HTMLDivElement, LanguageSelectorProps>(
  (props, ref) => {
    const { children, className, ...rest } = props;

    return (
      <div
        className={`
          group relative
          ${className ?? ''}
        `}
        ref={ref}
        {...rest}
      >
        {children}
      </div>
    );
  }
);

LanguageSelector.displayName = 'LanguageSelector';

export default LanguageSelector;
