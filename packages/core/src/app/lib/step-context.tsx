import {
  Children,
  type Context,
  cloneElement,
  createContext,
  isValidElement,
  type MutableRefObject,
  type PropsWithChildren,
  type ReactElement,
  useCallback,
  useContext,
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

export type StepAggregate = {
  revealed: number;
  stepCount: number;
};

type Registration = {
  id: object;
  stepCount: number;
  initialRevealed: number;
  controller: StepController;
  setRevealed: (n: number) => void;
};

type StepHostContextValue = {
  register: (reg: Registration) => () => void;
  reportRevealed: (id: object, revealed: number) => void;
  entryDirection: EntryDirection;
  controlled: boolean;
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
  // When set, the host distributes this count across <Steps> children in
  // mount order — first fills to its stepCount, next takes the remainder.
  controlledRevealed?: number;
  onAggregateChange?: (aggregate: StepAggregate) => void;
}>;

export function StepHost({
  isActivePage,
  entryDirection,
  controllerRef,
  controlledRevealed,
  onAggregateChange,
  children,
}: StepHostProps) {
  type Tracked = Registration & { revealed: number };
  const registrationsRef = useRef<Tracked[]>([]);

  const onAggregateChangeRef = useRef(onAggregateChange);
  onAggregateChangeRef.current = onAggregateChange;
  const controlledRevealedRef = useRef(controlledRevealed);
  controlledRevealedRef.current = controlledRevealed;

  const composite = useMemo<StepController>(
    () => ({
      advance: () => {
        for (const r of registrationsRef.current) {
          if (r.controller.advance()) return true;
        }
        return false;
      },
      retreat: () => {
        for (let i = registrationsRef.current.length - 1; i >= 0; i--) {
          if (registrationsRef.current[i].controller.retreat()) return true;
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

  const notifyAggregate = useCallback(() => {
    const cb = onAggregateChangeRef.current;
    if (!cb) return;
    let revealed = 0;
    let stepCount = 0;
    for (const r of registrationsRef.current) {
      revealed += r.revealed;
      stepCount += r.stepCount;
    }
    cb({ revealed, stepCount });
  }, []);

  const distributeControlled = useCallback(() => {
    const target = controlledRevealedRef.current;
    if (target == null) return;
    let remaining = target;
    for (const r of registrationsRef.current) {
      const share = Math.max(0, Math.min(r.stepCount, remaining));
      remaining -= share;
      if (r.revealed !== share) {
        r.revealed = share;
        r.setRevealed(share);
      }
    }
  }, []);

  useLayoutEffect(() => {
    if (controlledRevealed == null) return;
    distributeControlled();
    notifyAggregate();
  }, [controlledRevealed, distributeControlled, notifyAggregate]);

  const value = useMemo<StepHostContextValue>(
    () => ({
      register: (reg) => {
        const tracked: Tracked = { ...reg, revealed: reg.initialRevealed };
        registrationsRef.current.push(tracked);
        if (controlledRevealedRef.current != null) {
          distributeControlled();
        }
        notifyAggregate();
        return () => {
          const i = registrationsRef.current.indexOf(tracked);
          if (i !== -1) registrationsRef.current.splice(i, 1);
          notifyAggregate();
        };
      },
      reportRevealed: (id, revealed) => {
        const r = registrationsRef.current.find((x) => x.id === id);
        if (!r) return;
        r.revealed = revealed;
        notifyAggregate();
      },
      entryDirection,
      controlled: controlledRevealed != null,
    }),
    [entryDirection, controlledRevealed, distributeControlled, notifyAggregate],
  );

  return <StepHostContext.Provider value={value}>{children}</StepHostContext.Provider>;
}

export type StepsProps = PropsWithChildren;

export function Steps({ children }: StepsProps) {
  const host = useContext(StepHostContext);
  const flat = Children.toArray(children);
  const stepCount = flat.filter((c) => isValidElement(c) && c.type === Step).length;

  // Controlled mode waits for the host to assign a slice in the registration
  // layout-effect; otherwise the entry direction picks the initial reveal.
  const initial = host?.controlled ? 0 : host?.entryDirection === 'forward' ? 0 : stepCount;
  const revealedRef = useRef(initial);
  const [revealed, setRevealed] = useState(initial);

  const idRef = useRef<object>({});

  const applyRevealed = useCallback((n: number) => {
    revealedRef.current = n;
    setRevealed(n);
  }, []);

  useLayoutEffect(() => {
    if (!host) return;
    const id = idRef.current;
    const ctrl: StepController = {
      advance: () => {
        if (revealedRef.current >= stepCount) return false;
        applyRevealed(revealedRef.current + 1);
        host.reportRevealed(id, revealedRef.current);
        return true;
      },
      retreat: () => {
        if (revealedRef.current <= 0) return false;
        applyRevealed(revealedRef.current - 1);
        host.reportRevealed(id, revealedRef.current);
        return true;
      },
    };
    return host.register({
      id,
      stepCount,
      initialRevealed: revealedRef.current,
      controller: ctrl,
      setRevealed: applyRevealed,
    });
  }, [host, stepCount, applyRevealed]);

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
