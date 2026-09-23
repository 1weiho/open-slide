import { ChevronDown, RotateCcw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { planResetGesture } from '@/lib/inspector/use-visual-editor';
import type { ResetGestureScope } from '@/lib/inspector/visual-dom';
import { useLocale } from '@/lib/use-locale';
import { useInspector } from './inspector-provider';

type Resettable = Record<ResetGestureScope, boolean>;

export function ResetPositionButton({ disabled }: { disabled: boolean }) {
  const { selection, opsVersion, visual } = useInspector();
  const { inspector: t } = useLocale();
  const [resettable, setResettable] = useState<Resettable>({ transform: false, all: false });

  useEffect(() => {
    void opsVersion;
    const connected = selection.filter((target) => target.anchor.isConnected);
    setResettable({
      transform: planResetGesture(connected, 'transform').edits.length > 0,
      all: planResetGesture(connected, 'all').edits.length > 0,
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
            aria-label={t.resetPositionAria}
            disabled={disabled || !resettable.transform}
            onClick={(event) => visual.resetGesture(event.altKey ? 'all' : 'transform')}
          >
            <RotateCcw data-icon="inline-start" />
            <span className="truncate">{t.resetPosition}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent className="max-w-60">
          {resettable.transform ? t.resetHint : resettable.all ? t.resetAllOnly : t.resetNothing}
        </TooltipContent>
      </Tooltip>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="outline"
              size="icon-sm"
              className="-ml-px rounded-l-none"
              aria-label={t.resetOptions}
              disabled={disabled || !resettable.all}
            />
          }
        >
          <ChevronDown />
        </DropdownMenuTrigger>
        <DropdownMenuContent data-inspector-ui align="end" className="min-w-[200px]">
          <DropdownMenuItem
            disabled={!resettable.transform}
            onClick={() => visual.resetGesture('transform')}
          >
            {t.resetPositionOnly}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => visual.resetGesture('all')}>
            {t.resetAll}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
