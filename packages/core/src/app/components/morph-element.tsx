import {
  Children,
  type CSSProperties,
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from 'react';

export type MorphElementProps = {
  id: string;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
};

type MorphElementChildProps = {
  className?: string;
  style?: CSSProperties;
  'data-osd-morph'?: string;
};

export function MorphElement({ id, children, className, style }: MorphElementProps) {
  const child = Children.toArray(children)[0] ?? null;

  if (
    Children.count(children) === 1 &&
    isValidElement<MorphElementChildProps>(child) &&
    typeof child.type === 'string'
  ) {
    return cloneElement(child as ReactElement<MorphElementChildProps>, {
      'data-osd-morph': id,
      className: [child.props.className, className].filter(Boolean).join(' ') || undefined,
      style: style ? { ...child.props.style, ...style } : child.props.style,
    });
  }

  return (
    <div className={className} style={style} data-osd-morph={id}>
      {children}
    </div>
  );
}
