import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { toast } from 'sonner';
import {
  cssVarsToString,
  defaultDesign,
  type DesignSystem,
  designToCssVars,
} from '../../../design';
import { useDesign as useDesignFetch } from './useDesign';

type DesignCtx = {
  slideId: string;
  loaded: boolean;
  exists: boolean;
  warning: string | null;
  design: DesignSystem | null;
  draft: DesignSystem | null;
  dirty: boolean;
  committing: boolean;
  update: (mut: (next: DesignSystem) => void) => void;
  commit: () => Promise<void>;
  discard: () => void;
  resetToDefaults: () => void;
};

const Ctx = createContext<DesignCtx | null>(null);

export function useDesignPanelState(): DesignCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error('useDesignPanelState must be used inside <DesignProvider>');
  return v;
}

function clone<T>(d: T): T {
  return JSON.parse(JSON.stringify(d)) as T;
}

export function DesignProvider({ slideId, children }: { slideId: string; children: ReactNode }) {
  const { design, exists, warning, loaded, save } = useDesignFetch(slideId);
  const [draft, setDraft] = useState<DesignSystem | null>(null);
  const [committing, setCommitting] = useState(false);

  // Re-seed draft whenever the saved design changes (slide switch, post-save HMR).
  useEffect(() => {
    if (design) setDraft(clone(design));
  }, [design]);

  const dirty = useMemo(() => {
    if (!draft || !design) return false;
    return JSON.stringify(draft) !== JSON.stringify(design);
  }, [draft, design]);

  const update = useCallback((mut: (d: DesignSystem) => void) => {
    setDraft((prev) => {
      if (!prev) return prev;
      const next = clone(prev);
      mut(next);
      return next;
    });
  }, []);

  const commit = useCallback(async () => {
    if (!draft) return;
    setCommitting(true);
    const r = await save(draft);
    setCommitting(false);
    if (!r.ok) toast.error(r.error ?? 'Failed to save');
  }, [draft, save]);

  const discard = useCallback(() => {
    if (design) setDraft(clone(design));
  }, [design]);

  const resetToDefaults = useCallback(() => {
    setDraft(clone(defaultDesign));
  }, []);

  // Live-preview overlay: rendered only while there are unsaved changes, so the
  // canvas reflects the draft instantly, before any file write.
  const previewCss = useMemo(() => {
    if (!dirty || !draft) return '';
    return `[data-osd-canvas] {\n${cssVarsToString(designToCssVars(draft))}\n}`;
  }, [dirty, draft]);

  const value: DesignCtx = {
    slideId,
    loaded,
    exists,
    warning,
    design,
    draft,
    dirty,
    committing,
    update,
    commit,
    discard,
    resetToDefaults,
  };

  return (
    <Ctx.Provider value={value}>
      {previewCss && (
        // biome-ignore lint/security/noDangerouslySetInnerHtml: trusted local css from draft state.
        <style dangerouslySetInnerHTML={{ __html: previewCss }} />
      )}
      {children}
    </Ctx.Provider>
  );
}
