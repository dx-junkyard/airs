import {
  Children,
  cloneElement,
  type HTMLAttributes,
  isValidElement,
  type ReactNode,
} from 'react';

type SlotProps = HTMLAttributes<HTMLElement> & {
  children?: ReactNode;
};

const Slot = (props: SlotProps) => {
  const { children, ...rest } = props;

  // https://react.dev/reference/react/isValidElement
  // https://react.dev/reference/react/cloneElement
  if (isValidElement(children)) {
    const childProps = children.props as Record<string, unknown>;
    return cloneElement(children, {
      ...rest,
      ...childProps,
      className: `${rest.className ?? ''} ${childProps.className ?? ''}`,
    } as Partial<typeof children.props>);
  }

  if (Children.count(children) > 1) {
    Children.only(null);
  }

  return null;
};

export default Slot;
