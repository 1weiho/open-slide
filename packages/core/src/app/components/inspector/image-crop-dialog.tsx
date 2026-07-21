import { type SyntheticEvent, useEffect, useRef, useState } from 'react';
import ReactCrop, { type Crop, type PercentCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useLocale } from '@/lib/use-locale';

export type ImageCropRect = { x: number; y: number; width: number; height: number };

export type ImageCropResult = { fit: 'contain' } | { fit: 'cover'; rect: ImageCropRect };

export function ImageCropDialog({
  src,
  targetWidth,
  targetHeight,
  initialFit,
  initialPosition,
  initialRect,
  onClose,
  onApply,
}: {
  src: string;
  targetWidth: number;
  targetHeight: number;
  initialFit: 'cover' | 'contain';
  initialPosition: { x: number; y: number };
  initialRect: ImageCropRect | null;
  onClose: () => void;
  onApply: (result: ImageCropResult) => void;
}) {
  const t = useLocale();
  const [fit, setFit] = useState<'cover' | 'contain'>(initialFit);
  const aspect = targetWidth > 0 && targetHeight > 0 ? targetWidth / targetHeight : 1;
  const [crop, setCrop] = useState<Crop | undefined>(undefined);
  const imgRef = useRef<HTMLImageElement>(null);

  const onImageLoad = (e: SyntheticEvent<HTMLImageElement>) => {
    const im = e.currentTarget;
    setCrop(initialCrop(im.naturalWidth, im.naturalHeight, aspect, initialRect, initialPosition));
  };

  useEffect(() => {
    const im = imgRef.current;
    if (!im?.complete || !im.naturalWidth || !im.naturalHeight) return;
    setCrop((prev) => {
      if (prev && prev.unit === '%') {
        return clampToAspect(prev as PercentCrop, aspect, im.naturalWidth, im.naturalHeight);
      }
      return initialCrop(im.naturalWidth, im.naturalHeight, aspect, initialRect, initialPosition);
    });
  }, [aspect, initialPosition, initialRect]);

  const onApplyClick = () => {
    if (fit === 'contain') {
      onApply({ fit });
      return;
    }
    const rect =
      crop && crop.unit === '%'
        ? roundRect(crop as PercentCrop)
        : { x: 0, y: 0, width: 100, height: 100 };
    onApply({ fit, rect });
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t.inspector.cropDialogTitle}</DialogTitle>
          <DialogDescription>{t.inspector.cropDialogDescription}</DialogDescription>
        </DialogHeader>
        <div className="flex justify-center">
          <ToggleGroup
            value={[fit]}
            onValueChange={(value) => {
              const v = value[0];
              if (v === 'cover' || v === 'contain') setFit(v);
            }}
            variant="outline"
            size="sm"
          >
            <ToggleGroupItem value="cover" className="text-xs">
              {t.inspector.cropFitCover}
            </ToggleGroupItem>
            <ToggleGroupItem value="contain" className="text-xs">
              {t.inspector.cropFitContain}
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
        <div className="flex h-[420px] w-full items-center justify-center overflow-hidden rounded-md border bg-[repeating-conic-gradient(theme(colors.muted)_0_25%,transparent_0_50%)] bg-[length:12px_12px]">
          {fit === 'cover' ? (
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              aspect={aspect}
              keepSelection
              className="max-h-full"
            >
              <img
                ref={imgRef}
                src={src}
                alt=""
                style={{ maxHeight: 420, maxWidth: '100%' }}
                onLoad={onImageLoad}
              />
            </ReactCrop>
          ) : (
            <img src={src} alt="" className="max-h-full max-w-full object-contain" />
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t.common.cancel}
          </Button>
          <Button onClick={onApplyClick}>{t.inspector.cropApply}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function initialCrop(
  naturalW: number,
  naturalH: number,
  aspect: number,
  rect: ImageCropRect | null,
  position: { x: number; y: number },
): PercentCrop {
  if (rect) {
    return clampToAspect({ unit: '%', ...rect }, aspect, naturalW, naturalH);
  }
  return makeMaxSizeCrop(naturalW, naturalH, aspect, position);
}

function makeMaxSizeCrop(
  naturalW: number,
  naturalH: number,
  aspect: number,
  position: { x: number; y: number },
): PercentCrop {
  if (naturalW <= 0 || naturalH <= 0) {
    return { unit: '%', x: 0, y: 0, width: 100, height: 100 };
  }
  const sourceAspect = naturalW / naturalH;
  let width = 100;
  let height = 100;
  if (aspect >= sourceAspect) {
    width = 100;
    height = (sourceAspect / aspect) * 100;
  } else {
    height = 100;
    width = (aspect / sourceAspect) * 100;
  }
  const slackX = 100 - width;
  const slackY = 100 - height;
  const x = clamp((position.x / 100) * slackX, 0, slackX);
  const y = clamp((position.y / 100) * slackY, 0, slackY);
  return { unit: '%', x, y, width, height };
}

function clampToAspect(
  crop: PercentCrop,
  aspect: number,
  naturalW: number,
  naturalH: number,
): PercentCrop {
  const cx = crop.x + crop.width / 2;
  const cy = crop.y + crop.height / 2;
  let width = crop.width;
  let height = crop.height;
  const targetPctRatio = naturalW > 0 && naturalH > 0 ? (aspect * naturalH) / naturalW : aspect;
  const currentRatio = height > 0 ? width / height : targetPctRatio;
  if (Math.abs(currentRatio - targetPctRatio) > 0.0001) {
    if (currentRatio > targetPctRatio) {
      height = width / targetPctRatio;
    } else {
      width = height * targetPctRatio;
    }
  }
  width = clamp(width, 1, 100);
  height = clamp(height, 1, 100);
  let x = cx - width / 2;
  let y = cy - height / 2;
  x = clamp(x, 0, 100 - width);
  y = clamp(y, 0, 100 - height);
  return { unit: '%', x, y, width, height };
}

function roundRect(crop: PercentCrop): ImageCropRect {
  return {
    x: round2(crop.x),
    y: round2(crop.y),
    width: round2(crop.width),
    height: round2(crop.height),
  };
}

function clamp(v: number, lo: number, hi: number) {
  return v < lo ? lo : v > hi ? hi : v;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
