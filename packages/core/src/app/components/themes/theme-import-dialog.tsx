import config from 'virtual:open-slide/config';
import { AlertTriangle, Download, Loader2 } from 'lucide-react';
import { type FormEvent, useId, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { format, useLocale } from '@/lib/use-locale';

type DiscoveredTheme = { id: string; name: string; description: string };

type ImportResponse = {
  ok?: boolean;
  written?: Array<{ id: string; requestedId: string; renamed: boolean }>;
  discovered?: DiscoveredTheme[];
  error?: string;
};

// Matches the CLI, which skips its trust prompt when imports are already
// restricted to allow-listed hosts.
const restrictedToAllowedHosts = (config.themeImport?.allowedHosts?.length ?? 0) > 0;

export function ThemeImportDialog() {
  const t = useLocale();
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [discovered, setDiscovered] = useState<DiscoveredTheme[] | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const inputId = useId();

  function resetDiscovery() {
    setDiscovered(null);
    setSelectedIds([]);
  }

  function toggleSelected(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const value = url.trim();
    if (!value || busy) return;
    if (discovered && selectedIds.length === 0) return;
    setBusy(true);
    try {
      const res = await fetch('/__themes/import', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(discovered ? { url: value, ids: selectedIds } : { url: value }),
      });
      const body = (await res.json().catch(() => ({}))) as ImportResponse;
      if (!res.ok || !body.ok) {
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      if (body.discovered) {
        setDiscovered(body.discovered);
        setSelectedIds(body.discovered.map((d) => d.id));
        return;
      }
      const written = body.written ?? [];
      const renames = written
        .filter((w) => w.renamed)
        .map((w) => `${w.requestedId} → ${w.id}`)
        .join(', ');
      toast.success(
        format(t.themes.importSuccess, { ids: written.map((w) => w.id).join(', ') || '—' }),
        renames ? { description: format(t.themes.importRenamed, { renames }) } : undefined,
      );
      setUrl('');
      resetDiscovery();
      setOpen(false);
    } catch (err) {
      toast.error(format(t.themes.importFailed, { msg: (err as Error).message }));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (busy) return;
        setOpen(next);
        if (!next) resetDiscovery();
      }}
    >
      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            <Download className="size-4" />
            {t.themes.importFromUrl}
          </Button>
        }
      />
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{t.themes.importDialogTitle}</DialogTitle>
            <DialogDescription>{t.themes.importDialogDescription}</DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex flex-col gap-3">
            <Input
              id={inputId}
              type="url"
              inputMode="url"
              autoFocus
              placeholder={t.themes.importUrlPlaceholder}
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                resetDiscovery();
              }}
            />
            {discovered && (
              <div className="flex flex-col gap-2">
                <p className="text-[12px] text-muted-foreground">
                  {format(t.themes.importMultipleFound, { count: String(discovered.length) })}
                </p>
                <div className="flex max-h-48 flex-col gap-1 overflow-y-auto">
                  {discovered.map((theme) => (
                    <label
                      key={theme.id}
                      className="flex cursor-pointer items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm hover:bg-accent"
                    >
                      <input
                        type="checkbox"
                        className="accent-foreground"
                        checked={selectedIds.includes(theme.id)}
                        onChange={() => toggleSelected(theme.id)}
                      />
                      <span className="truncate font-medium">{theme.name}</span>
                      <span className="truncate text-muted-foreground text-xs">{theme.id}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            {!restrictedToAllowedHosts && (
              <p className="flex items-start gap-2 text-[12px] leading-relaxed text-muted-foreground">
                <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-500" />
                <span>{t.themes.importWarning}</span>
              </p>
            )}
          </div>
          <DialogFooter className="mt-5">
            <Button
              type="submit"
              size="sm"
              disabled={
                busy || url.trim().length === 0 || (discovered !== null && selectedIds.length === 0)
              }
            >
              {busy ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
              {busy ? t.themes.importing : t.themes.importAction}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
