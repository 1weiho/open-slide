import {
  Children,
  type Context,
  cloneElement,
  createContext,
  isValidElement,
  type MutableRefObject,
  type PropsWithChildren,
  type ReactElement,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { usePrefersReducedMotion } from './use-prefers-reduced-motion';

export type EntryDirection = 'forward' | 'backward' | 'jump';

export type StepController = {
  advance: () => boolean;
  retreat: () => boolean;
};

type StepHostContextValue = {
  register: (ctrl: StepController) => () => void;
  entryDirection: EntryDirection;
};

const GLOBAL_KEY = '__open_slide_step_host_context__';
type GlobalWithCtx = typeof globalThis & {
  [GLOBAL_KEY]?: Context<StepHostContextValue | null>;
};
const g = globalThis as GlobalWithCtx;
if (!g[GLOBAL_KEY]) {
  g[GLOBAL_KEY] = createContext<StepHostContextValue | null>(null);
}
const StepHostContext = g[GLOBAL_KEY];

type StepHostProps = PropsWithChildren<{
  isActivePage: boolean;
  entryDirection: EntryDirection;
  controllerRef: MutableRefObject<StepController | null>;
}>;

export function StepHost({ isActivePage, entryDirection, controllerRef, children }: StepHostProps) {
  const controllersRef = useRef<StepController[]>([]);

  const composite = useMemo<StepController>(
    () => ({
      advance: () => {
        for (const c of controllersRef.current) {
          if (c.advance()) return true;
        }
        return false;
      },
      retreat: () => {
        for (let i = controllersRef.current.length - 1; i >= 0; i--) {
          if (controllersRef.current[i].retreat()) return true;
        }
        return false;
      },
    }),
    [],
  );

  // useLayoutEffect cleanup-then-mount ordering keeps the registry slot
  // continuous across page swaps — the outgoing host clears its composite
  // before the next active host installs its own, with no gap and no overlap.
  useLayoutEffect(() => {
    if (!isActivePage) return;
    controllerRef.current = composite;
    return () => {
      if (controllerRef.current === composite) controllerRef.current = null;
    };
  }, [isActivePage, composite, controllerRef]);

  const value = useMemo<StepHostContextValue>(
    () => ({
      register: (ctrl) => {
        if (!isActivePage) return () => {};
        controllersRef.current.push(ctrl);
        return () => {
          const i = controllersRef.current.indexOf(ctrl);
          if (i !== -1) controllersRef.current.splice(i, 1);
        };
      },
      entryDirection,
    }),
    [isActivePage, entryDirection],
  );

  return <StepHostContext.Provider value={value}>{children}</StepHostContext.Provider>;
}

export type StepsProps = PropsWithChildren;

export function Steps({ children }: StepsProps) {
  const host = useContext(StepHostContext);
  const flat = Children.toArray(children);
  const stepCount = flat.filter((c) => isValidElement(c) && c.type === Step).length;

  const initial = host?.entryDirection === 'forward' ? 0 : stepCount;
  const revealedRef = useRef(initial);
  const [revealed, setRevealed] = useState(initial);

  useEffect(() => {
    if (!host) return;
    const ctrl: StepController = {
      advance: () => {
        if (revealedRef.current >= stepCount) return false;
        revealedRef.current += 1;
        setRevealed(revealedRef.current);
        return true;
      },
      retreat: () => {
        if (revealedRef.current <= 0) return false;
        revealedRef.current -= 1;
        setRevealed(revealedRef.current);
        return true;
      },
    };
    return host.register(ctrl);
  }, [host, stepCount]);

  const effectiveRevealed = host ? revealed : stepCount;

  let stepIdx = 0;
  return (
    <>
      {flat.map((child, key) => {
        if (isValidElement(child) && child.type === Step) {
          const idx = stepIdx++;
          return cloneElement(child as ReactElement<{ _revealed?: boolean }>, {
            key: child.key ?? key,
            _revealed: idx < effectiveRevealed,
          });
        }
        return child;
      })}
    </>
  );
}

export type StepProps = PropsWithChildren<{
  duration?: number;
}>;

type InternalStepProps = StepProps & { _revealed?: boolean };

export function Step({ children, duration = 180, _revealed }: InternalStepProps) {
  const reduceMotion = usePrefersReducedMotion();
  const revealed = _revealed ?? true;
  const ms = reduceMotion ? 0 : duration;

  return (
    <div
      data-osd-step={revealed ? 'revealed' : 'pending'}
      style={{
        opacity: revealed ? 1 : 0,
        visibility: revealed ? 'visible' : 'hidden',
        transition: `opacity ${ms}ms cubic-bezier(0, 0, 0.2, 1)`,
      }}
    >
      {children}
    </div>
  );
}
