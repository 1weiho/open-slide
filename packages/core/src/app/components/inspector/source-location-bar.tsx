import config from 'virtual:open-slide/config';
import { Bot, Copy, Layers, MousePointer2, SquareDashedMousePointer } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  formatAgentSnippet,
  formatSourceLocation,
  type InspectorStatus,
  sourceFilePath,
  summarizeElement,
} from '@/lib/inspector/source-location';
import { format, useLocale } from '@/lib/use-locale';
import type { SelectedTarget } from './inspector-provider';

async function copyText(text: string, success: string, failure: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(success);
  } catch {
    toast.error(failure);
  }
}

export function SourceLocationBar({
  slideId,
  selected,
  selection,
  status,
}: {
  slideId: string;
  selected: SelectedTarget;
  selection: SelectedTarget[];
  status: InspectorStatus;
}) {
  const t = useLocale();
  const location = formatSourceLocation(slideId, selected, config.slidesDir);
  const more = selection.length - 1;
  const copyLocation = () =>
    copyText(location, t.inspector.sourceLocationCopied, t.inspector.clipboardFailed);
  const copyForAgent = () =>
    copyText(
      formatAgentSnippet(
        slideId,
        [selected, ...selection.filter((target) => target !== selected)].map((target) => ({
          ...target,
          ...summarizeElement(target.anchor),
        })),
        config.slidesDir,
      ),
      t.inspector.agentSnippetCopied,
      t.inspector.clipboardFailed,
    );

  return (
    <div data-inspector-source className="flex shrink-0 flex-col gap-1.5 px-3.5 pb-1">
      <div className="flex min-w-0 items-center gap-1">
        <code
          className="min-w-0 flex-1 truncate font-mono text-[10.5px] text-muted-foreground"
          title={location}
          dir="rtl"
        >
          <bdi>{location}</bdi>
        </code>
        {more > 0 && (
          <span className="shrink-0 font-mono text-[10.5px] text-muted-foreground">
            {format(t.inspector.sourceLocationMore, { count: more })}
          </span>
        )}
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={copyLocation}
          aria-label={t.inspector.copySourceLocation}
          title={t.inspector.copySourceLocation}
        >
          <Copy />
        </Button>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={copyForAgent}
          aria-label={t.inspector.copyForAgent}
          title={t.inspector.copyForAgent}
        >
          <Bot />
        </Button>
      </div>
      {status.kind === 'shared' && (
        <p className="flex items-start gap-1.5 text-[11px] leading-snug text-muted-foreground">
          <Layers aria-hidden className="mt-px size-3 shrink-0" />
          {format(t.inspector.sharedInstancesHint, { count: status.instances })}
        </p>
      )}
    </div>
  );
}

export function InspectorEmptyState({
  slideId,
  status,
}: {
  slideId: string;
  status: InspectorStatus;
}) {
  const t = useLocale();
  const untraced = status.kind === 'untraced';
  const Icon = untraced ? SquareDashedMousePointer : MousePointer2;
  return (
    <div
      data-inspector-empty={status.kind}
      className="flex flex-col items-center gap-3 px-7 py-16 text-center"
    >
      <Icon aria-hidden className="size-8 text-muted-foreground/50" />
      <div className="flex flex-col gap-1.5">
        <h2 className="text-[13px] font-medium">
          {untraced ? t.inspector.untracedTitle : t.inspector.emptySelectionTitle}
        </h2>
        <p className="text-[12px] leading-relaxed text-muted-foreground">
          {untraced
            ? format(t.inspector.untracedHint, {
                tag: status.tagName,
                file: sourceFilePath(slideId, config.slidesDir),
              })
            : t.inspector.emptySelectionHint}
        </p>
      </div>
    </div>
  );
}
