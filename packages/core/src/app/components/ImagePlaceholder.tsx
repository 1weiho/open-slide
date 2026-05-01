import type { CSSProperties, HTMLAttributes } from 'react';

export type ImagePlaceholderProps = {
  hint: string;
  width?: number;
  height?: number;
  style?: CSSProperties;
  className?: string;
} & Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'style' | 'className'>;

export function ImagePlaceholder({
  hint,
  width,
  height,
  style,
  className,
  ...rest
}: ImagePlaceholderProps) {
  const dims = width && height ? `${width} × ${height}` : null;
  return (
    <div
      {...rest}
      data-slide-placeholder={hint}
      data-placeholder-w={width}
      data-placeholder-h={height}
      role="img"
      aria-label={hint}
      style={{
        width: width ?? '100%',
        height: height ?? '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 8,
        border: '2px dashed currentColor',
        borderRadius: 8,
        background:
          'repeating-conic-gradient(rgba(127,127,127,0.18) 0% 25%, transparent 0% 50%) 50% / 24px 24px',
        color: 'rgba(127,127,127,0.85)',
        fontFamily: 'system-ui, sans-serif',
        fontSize: 18,
        textAlign: 'center',
        padding: 16,
        boxSizing: 'border-box',
        opacity: 0.9,
        ...style,
      }}
      className={className}
    >
      <span style={{ fontSize: 28, opacity: 0.6 }}>🖼</span>
      <span style={{ fontWeight: 600, maxWidth: '90%' }}>{hint}</span>
      {dims && <span style={{ fontSize: 14, opacity: 0.7 }}>{dims}</span>}
    </div>
  );
}
