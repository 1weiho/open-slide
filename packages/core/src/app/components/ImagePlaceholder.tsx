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
        position: 'relative',
        width: width ?? '100%',
        height: height ?? '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 14,
        border: '1px dashed rgba(120, 120, 130, 0.35)',
        borderRadius: 12,
        background:
          'linear-gradient(135deg, rgba(120,120,130,0.06) 0%, rgba(120,120,130,0.02) 50%, rgba(120,120,130,0.06) 100%)',
        color: 'rgba(90, 90, 100, 0.7)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", system-ui, sans-serif',
        textAlign: 'center',
        padding: 24,
        boxSizing: 'border-box',
        overflow: 'hidden',
        ...style,
      }}
      className={className}
    >
      <PlaceholderIcon />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 6,
          maxWidth: '85%',
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            opacity: 0.55,
          }}
        >
          Image
        </span>
        <span
          style={{
            fontSize: 16,
            fontWeight: 500,
            lineHeight: 1.4,
            color: 'rgba(60, 60, 70, 0.85)',
          }}
        >
          {hint}
        </span>
        {dims && (
          <span
            style={{
              fontSize: 11,
              fontVariantNumeric: 'tabular-nums',
              fontFamily: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace',
              opacity: 0.5,
              marginTop: 2,
            }}
          >
            {dims}
          </span>
        )}
      </div>
    </div>
  );
}

function PlaceholderIcon() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ opacity: 0.55 }}
      role="img"
      aria-label="image placeholder"
    >
      <title>image placeholder</title>
      <rect x="4" y="6" width="24" height="20" rx="2.5" />
      <circle cx="11" cy="13" r="2" />
      <path d="M4 22l7-7 6 6 4-4 7 7" />
    </svg>
  );
}
