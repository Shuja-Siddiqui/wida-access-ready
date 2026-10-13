/** Button label after a correct answer (must match AnswerStepButtons). */
export function resolveAdvanceButtonLabel(isLast: boolean, advanceLabel?: string): string {
  return advanceLabel ?? (isLast ? "Finish" : "Next");
}

/** Spoken cue appended after coaching — must match the primary advance button. */
export function advanceButtonNavCue(isLast: boolean, advanceLabel?: string): string {
  const label = resolveAdvanceButtonLabel(isLast, advanceLabel);
  return `Tap ${label}.`;
}
