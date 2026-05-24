import type { HTMLAttributes, ImgHTMLAttributes } from 'react';

export type PptxPrimitiveKind =
  | 'text'
  | 'box'
  | 'image'
  | 'shape'
  | 'group'
  | 'raster'
  | 'equation';

export type PptxShapeKind = 'rect' | 'roundRect' | 'ellipse' | 'line';

export type PptxTextProps = HTMLAttributes<HTMLDivElement>;

export type PptxBoxProps = HTMLAttributes<HTMLDivElement>;

export type PptxImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  alt: string;
};

export type PptxRasterLayerProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
  alt: string;
  dataUrl: string;
  reason: string;
};

export type PptxEquationProps = HTMLAttributes<HTMLDivElement> & {
  fallbackText?: string;
  inline?: boolean;
  latex?: string;
  mathml?: string;
};

export type PptxShapeProps = HTMLAttributes<HTMLDivElement> & {
  shape?: PptxShapeKind;
};

export type PptxGroupProps = HTMLAttributes<HTMLDivElement>;

export function PptxText({ children, ...props }: PptxTextProps) {
  return (
    <div {...props} data-osd-pptx-kind="text">
      {children}
    </div>
  );
}

export function PptxBox({ children, ...props }: PptxBoxProps) {
  return (
    <div {...props} data-osd-pptx-kind="box">
      {children}
    </div>
  );
}

export function PptxImage({ alt, ...props }: PptxImageProps) {
  return <img {...props} alt={alt} data-osd-pptx-kind="image" />;
}

export function PptxRasterLayer({ alt, dataUrl, reason, ...props }: PptxRasterLayerProps) {
  return (
    <img
      {...props}
      alt={alt}
      src={dataUrl}
      data-osd-pptx-kind="raster"
      data-osd-pptx-reason={reason}
    />
  );
}

export function PptxEquation({
  fallbackText,
  inline = false,
  latex,
  mathml,
  children,
  ...props
}: PptxEquationProps) {
  const text = fallbackText ?? latex ?? mathml ?? children;
  return (
    <div
      {...props}
      data-osd-pptx-kind="equation"
      data-osd-pptx-latex={latex}
      data-osd-pptx-mathml={mathml}
      data-osd-pptx-inline={inline ? 'true' : undefined}
      data-osd-pptx-fallback={fallbackText}
    >
      {text}
    </div>
  );
}

export function PptxShape({ children, shape = 'rect', ...props }: PptxShapeProps) {
  return (
    <div {...props} data-osd-pptx-kind="shape" data-osd-pptx-shape={shape}>
      {children}
    </div>
  );
}

export function PptxGroup({ children, ...props }: PptxGroupProps) {
  return (
    <div {...props} data-osd-pptx-kind="group">
      {children}
    </div>
  );
}
