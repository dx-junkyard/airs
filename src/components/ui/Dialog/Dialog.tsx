import { type ComponentProps, forwardRef } from 'react';

export type DialogProps = ComponentProps<'dialog'>;

/**
 * ※ ModalDialog は v1 のみのコンポーネントのため、v2 では非推奨となっています。
 * v2 に対応したダイアログは今後提供予定です。
 */
const Dialog = forwardRef<HTMLDialogElement, DialogProps>((props, ref) => {
  const { children, className, ...rest } = props;

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: light dismiss for v1 only
    <dialog
      className={`
        fixed inset-0 m-auto size-fit max-h-[90vh] max-w-[90vw] bg-transparent
        p-6
        backdrop:bg-black/45
        ${className ?? ''}
      `}
      onClick={(e) => {
        e.currentTarget.close();
      }}
      ref={ref}
      {...rest}
    >
      {children}
    </dialog>
  );
});

Dialog.displayName = 'Dialog';

export default Dialog;
