import { type CSSProperties, type HTMLAttributes, useRef, useState } from 'react';
import { toast } from 'sonner';
import { uploadWithAutoRename } from '@/lib/assets';
import { useLocale } from '@/lib/use-locale';
import { dragHasFiles } from '../lib/dom';

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
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const dragDepth = useRef(0);
  const t = useLocale();

  const dndProps = import.meta.env.DEV
    ? {
        onDragEnter: (e: React.DragEvent<HTMLDivElement>) => {
          if (uploading || !dragHasFiles(e)) return;
          e.preventDefault();
          dragDepth.current += 1;
          setDragActive(true);
        },
        onDragOver: (e: React.DragEvent<HTMLDivElement>) => {
          if (uploading || !dragHasFiles(e)) return;
          e.preventDefault();
          e.dataTransfer.dropEffect = 'copy';
        },
        onDragLeave: () => {
          dragDepth.current = Math.max(0, dragDepth.current - 1);
          if (dragDepth.current === 0) setDragActive(false);
        },
        onDrop: (e: React.DragEvent<HTMLDivElement>) => {
          if (uploading || !dragHasFiles(e)) return;
          e.preventDefault();
          dragDepth.current = 0;
          setDragActive(false);
          const file = pickImageFile(e.dataTransfer.files);
          if (!file) return;
          const root = e.currentTarget;
          const slideId = root.closest<HTMLElement>('[data-slide-id]')?.dataset.slideId;
          const loc = root.dataset.slideLoc;
          if (!slideId || !loc) return;
          const idx = loc.indexOf(':');
          if (idx <= 0) return;
          const line = Number(loc.slice(0, idx));
          const column = Number(loc.slice(idx + 1));
          if (!Number.isFinite(line) || !Number.isFinite(column)) return;
          setUploading(true);
          handleDrop(slideId, file, line, column)
            .catch(() => toast.error(t.imagePlaceholder.uploadFailed))
            .finally(() => setUploading(false));
        },
      }
    : null;

  return (
    <div
      {...rest}
      {...dndProps}
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
      {import.meta.env.DEV && (dragActive || uploading) && (
        <DropOverlay
          label={uploading ? t.imagePlaceholder.uploading : t.imagePlaceholder.dropOverlay}
        />
      )}
    </div>
  );
}

function DropOverlay({ label }: { label: string }) {
  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        borderRadius: 12,
        border: '2px dashed oklch(0.62 0.18 250)',
        background: 'oklch(0.62 0.18 250 / 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <span
        style={{
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: '0.02em',
          color: 'oklch(0.45 0.16 250)',
          background: 'rgba(255,255,255,0.92)',
          padding: '6px 10px',
          borderRadius: 6,
          boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
        }}
      >
        {label}
      </span>
    </div>
  );
}

function pickImageFile(files: FileList): File | null {
  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    if (f.type.startsWith('image/')) return f;
  }
  return null;
}

async function handleDrop(slideId: string, file: File, line: number, column: number) {
  const { ok, entry } = await uploadWithAutoRename(slideId, file);
  if (!ok || !entry) throw new Error('upload failed');
  const res = await fetch('/__edit', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      slideId,
      line,
      column,
      ops: [{ kind: 'replace-placeholder-with-image', assetPath: `./assets/${entry.name}` }],
    }),
  });
  if (!res.ok) throw new Error(`edit failed (${res.status})`);
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
