import { ChevronDown, Eraser } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { planClearLayout } from '@/lib/inspector/use-visual-editor';
import type { ClearLayoutScope } from '@/lib/inspector/visual-dom';
import { useLocale } from '@/lib/use-locale';
import { useInspector } from './inspector-provider';

type Clearable = Record<ClearLayoutScope, boolean>;

export function ClearLayoutButton({ disabled }: { disabled: boolean }) {
  const { selection, opsVersion, visual } = useInspector();
  const { inspector: t } = useLocale();
  const [clearable, setClearable] = useState<Clearable>({ transform: false, all: false });

  useEffect(() => {
    void opsVersion;
    const connected = selection.filter((target) => target.anchor.isConnected);
    setClearable({
      transform: planClearLayout(connected, 'transform').edits.length > 0,
      all: planClearLayout(connected, 'all').edits.length > 0,
    });
  }, [selection, opsVersion]);

  return (
    <div className="flex min-w-0">
      <Tooltip>
        <TooltipTrigger render={<span className="flex min-w-0 flex-1" />}>
          <Button
            variant="outline"
            size="sm"
            className="min-w-0 flex-1 rounded-r-none"
            disabled={disabled || !clearable.transform}
            onClick={(event) => visual.clearLayout(event.altKey ? 'all' : 'transform')}
          >
            <Eraser data-icon="inline-start" />
            <span className="truncate">{t.clearLayout}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent className="max-w-60">
          {clearable.transform
            ? t.clearLayoutHint
            : clearable.all
              ? t.clearLayoutAltOnly
              : t.clearLayoutNothing}
        </TooltipContent>
      </Tooltip>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="outline"
              size="icon-sm"
              className="-ml-px rounded-l-none"
              aria-label={t.clearLayoutOptions}
              disabled={disabled || !clearable.all}
            />
          }
        >
          <ChevronDown />
        </DropdownMenuTrigger>
        <DropdownMenuContent data-inspector-ui align="end" className="min-w-[200px]">
          <DropdownMenuItem
            disabled={!clearable.transform}
            onClick={() => visual.clearLayout('transform')}
          >
            {t.clearLayoutTransform}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => visual.clearLayout('all')}>
            {t.clearLayoutAll}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
