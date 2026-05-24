import type { HTMLAttributes, ImgHTMLAttributes } from 'react';

export type PptxPrimitiveKind = 'text' | 'box' | 'image' | 'shape' | 'group' | 'raster';

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
