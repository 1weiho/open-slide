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
};

export function createStepRegistry(onChange?: (aggregate: StepAggregate) => void): StepRegistry {
  const registrations: Array<StepRegistration & { revealed: boolean }> = [];

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
      notify();
      return () => {
        const index = registrations.indexOf(tracked);
        if (index !== -1) registrations.splice(index, 1);
        notify();
      };
    },
    aggregate,
  };
}
