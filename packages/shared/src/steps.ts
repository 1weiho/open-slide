export type EntryDirection = 'forward' | 'backward' | 'jump';

export type StepAggregate = {
  revealed: number;
  stepCount: number;
};

export type StepController = {
  advance: () => boolean;
  retreat: () => boolean;
};

export type StepRegistration = {
  initialRevealed: boolean;
  setRevealed: (revealed: boolean) => void;
};

export type StepRegistry = {
  controller: StepController;
  register: (registration: StepRegistration) => () => void;
  aggregate: () => StepAggregate;
  setRevealed: (revealed: number) => void;
};

export function createStepRegistry(onChange?: (aggregate: StepAggregate) => void): StepRegistry {
  const registrations: Array<StepRegistration & { revealed: boolean }> = [];
  let controlledRevealed: number | null = null;

  const aggregate = (): StepAggregate => ({
    revealed: registrations.filter((registration) => registration.revealed).length,
    stepCount: registrations.length,
  });
  const notify = () => onChange?.(aggregate());
  const set = (registration: (typeof registrations)[number], revealed: boolean) => {
    registration.revealed = revealed;
    registration.setRevealed(revealed);
    notify();
  };
  const distribute = () => {
    if (controlledRevealed === null) return;
    const target = Math.max(0, Math.min(Math.floor(controlledRevealed), registrations.length));
    for (let index = 0; index < registrations.length; index++) {
      const registration = registrations[index];
      const next = index < target;
      if (registration.revealed !== next) {
        registration.revealed = next;
        registration.setRevealed(next);
      }
    }
  };

  return {
    controller: {
      advance: () => {
        const registration = registrations.find((candidate) => !candidate.revealed);
        if (!registration) return false;
        set(registration, true);
        return true;
      },
      retreat: () => {
        for (let index = registrations.length - 1; index >= 0; index--) {
          const registration = registrations[index];
          if (!registration.revealed) continue;
          set(registration, false);
          return true;
        }
        return false;
      },
    },
    register: (registration) => {
      const tracked = { ...registration, revealed: registration.initialRevealed };
      registrations.push(tracked);
      distribute();
      notify();
      return () => {
        const index = registrations.indexOf(tracked);
        if (index !== -1) registrations.splice(index, 1);
        notify();
      };
    },
    aggregate,
    setRevealed: (revealed) => {
      controlledRevealed = revealed;
      distribute();
      notify();
    },
  };
}
