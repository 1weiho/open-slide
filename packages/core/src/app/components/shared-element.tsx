import {
  Children,
  type CSSProperties,
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from 'react';

export type unstable_SharedElementProps = {
  id: string;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
};

type SharedElementChildProps = {
  className?: string;
  style?: CSSProperties;
  'data-osd-shared-element'?: string;
};

export function unstable_SharedElement({
  id,
  children,
  className,
  style,
}: unstable_SharedElementProps) {
  const child = Children.toArray(children)[0] ?? null;

  if (
    Children.count(children) === 1 &&
    isValidElement<SharedElementChildProps>(child) &&
    typeof child.type === 'string'
  ) {
    return cloneElement(child as ReactElement<SharedElementChildProps>, {
      'data-osd-shared-element': id,
      className: [child.props.className, className].filter(Boolean).join(' ') || undefined,
      style: style ? { ...child.props.style, ...style } : child.props.style,
    });
  }

  return (
    <div className={className} style={style} data-osd-shared-element={id}>
      {children}
    </div>
  );
}
