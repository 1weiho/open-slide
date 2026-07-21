import { ArrowDownToLine, Loader2, Upload } from 'lucide-react';
import type React from 'react';
import { useCallback, useId, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { type AssetEntry, uploadWithAutoRename, useAssets } from '@/lib/assets';
import { format, useLocale } from '@/lib/use-locale';
import { cn } from '@/lib/utils';

export type PickerScope = 'slide' | 'global';
const GLOBAL_PICKER_SLIDE_ID = '@global';

export function AssetPickerDialog({
  slideId,
  onClose,
  onPick,
}: {
  slideId: string;
  onClose: () => void;
  onPick: (asset: AssetEntry, scope: PickerScope) => void;
}) {
  const [scope, setScope] = useState<PickerScope>('slide');
  const effectiveSlideId = scope === 'global' ? GLOBAL_PICKER_SLIDE_ID : slideId;
  const { assets, loading, refresh } = useAssets(effectiveSlideId);
  const images = assets.filter((a) => a.mime.startsWith('image/'));
  const t = useLocale();
  const path = scope === 'global' ? 'assets/' : `slides/${slideId}/assets/`;
  const [descPrefix, descSuffix] = t.inspector.replaceImageDescription.split('{path}');
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const dragDepth = useRef(0);
  const inputId = useId();

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) return;
      setUploading(true);
      try {
        const { ok, status, entry } = await uploadWithAutoRename(effectiveSlideId, file);
        if (!ok || !entry) {
          toast.error(format(t.asset.toastUploadFailed, { status }));
          return;
        }
        await refresh().catch(() => {});
        onPick(entry, scope);
      } finally {
        setUploading(false);
      }
    },
    [effectiveSlideId, scope, refresh, onPick, t],
  );

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t.inspector.replaceImageDialogTitle}</DialogTitle>
          <DialogDescription>
            {descPrefix}
            <span className="font-mono">{path}</span>
            {descSuffix}
          </DialogDescription>
        </DialogHeader>
        <Tabs value={scope} onValueChange={(next) => setScope(next as PickerScope)}>
          <TabsList>
            <TabsTrigger value="slide">{t.asset.scopeSlide}</TabsTrigger>
            <TabsTrigger value="global">{t.asset.scopeGlobal}</TabsTrigger>
          </TabsList>
        </Tabs>
        <label
          htmlFor={inputId}
          className={cn(
            'absolute right-12 top-3.5 inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-[5px] border border-border bg-card px-2 text-[12px] font-medium transition-colors',
            'hover:bg-muted/60 hover:border-foreground/20 active:translate-y-px',
            uploading && 'pointer-events-none opacity-60',
          )}
        >
          {uploading ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Upload className="size-3.5" />
          )}
          <span>{t.asset.upload}</span>
        </label>
        <input
          id={inputId}
          type="file"
          accept="image/*"
          className="sr-only"
          disabled={uploading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (file) handleFile(file).catch(() => {});
          }}
        />
        <section
          aria-label={t.inspector.replaceImageDialogTitle}
          className="relative max-h-[60vh] overflow-y-auto"
          onDragEnter={(e) => {
            if (uploading || !hasFiles(e)) return;
            e.preventDefault();
            dragDepth.current += 1;
            setDragActive(true);
          }}
          onDragOver={(e) => {
            if (uploading || !hasFiles(e)) return;
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
          }}
          onDragLeave={() => {
            dragDepth.current = Math.max(0, dragDepth.current - 1);
            if (dragDepth.current === 0) setDragActive(false);
          }}
          onDrop={(e) => {
            if (uploading || !hasFiles(e)) return;
            e.preventDefault();
            dragDepth.current = 0;
            setDragActive(false);
            const file = e.dataTransfer.files?.[0];
            if (file) handleFile(file).catch(() => {});
          }}
        >
          {loading ? (
            <p className="px-1 py-6 text-center text-xs text-muted-foreground">
              {t.inspector.pickerLoading}
            </p>
          ) : images.length === 0 ? (
            <p className="px-1 py-6 text-center text-xs text-muted-foreground">
              {t.inspector.pickerEmpty}
            </p>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-3">
              {images.map((asset) => (
                <button
                  key={asset.name}
                  type="button"
                  onClick={() => onPick(asset, scope)}
                  className={cn(
                    'group flex flex-col overflow-hidden rounded-lg border bg-card text-left shadow-sm transition-all',
                    'hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none',
                  )}
                >
                  <div className="flex aspect-square w-full items-center justify-center overflow-hidden bg-[repeating-conic-gradient(theme(colors.muted)_0_25%,transparent_0_50%)] bg-[length:12px_12px]">
                    <img
                      src={asset.url}
                      alt=""
                      className="size-full object-contain"
                      draggable={false}
                    />
                  </div>
                  <div className="border-t px-2 py-1.5">
                    <div className="truncate text-[11px] font-medium" title={asset.name}>
                      {asset.name}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
          {dragActive && (
            <div
              className="pointer-events-none absolute inset-0 z-10 animate-in fade-in-0 duration-200"
              aria-hidden
            >
              <div className="absolute inset-0 bg-brand/5" />
              <div className="absolute inset-1 rounded-[8px] border border-dashed border-brand/40" />
              <div className="absolute inset-x-0 bottom-4 flex justify-center">
                <div className="flex items-center gap-2 rounded-[6px] border border-border bg-card px-3 py-1.5 text-[12px] font-medium shadow-floating">
                  <ArrowDownToLine className="size-3.5 text-brand" />
                  <span>{t.asset.dropToUpload}</span>
                </div>
              </div>
            </div>
          )}
        </section>
      </DialogContent>
    </Dialog>
  );
}

function hasFiles(e: React.DragEvent): boolean {
  const types = e.dataTransfer?.types;
  if (!types) return false;
  for (let i = 0; i < types.length; i++) {
    if (types[i] === 'Files') return true;
  }
  return false;
}
