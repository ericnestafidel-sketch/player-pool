const STEPS = [
  "Choose account type",
  "Coach details and verification links",
  "Reference and conduct checkboxes",
  "Submit, then wait for review",
] as const;

/** step 1–4 is the current step. "review" means the application was submitted. */
export function CoachSetupChecklist({ step }: { step: 1 | 2 | 3 | 4 | "review" }) {
  return (
    <ol className="setup-steps">
      {STEPS.map((label, index) => {
        const number = index + 1;
        const done = step === "review" || (typeof step === "number" && number < step);
        const current = step !== "review" && number === step;
        const className = done ? "done" : current ? "current" : undefined;
        return (
          <li className={className} key={label} aria-current={current ? "step" : undefined}>
            {number}. {label}
          </li>
        );
      })}
    </ol>
  );
}
