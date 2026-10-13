/** Keep listening tasks audio-first: one script field for TTS, no printable passage on screen. */
export function prepareListeningSessionData(
  data: Record<string, unknown>,
): Record<string, unknown> {
  const passage =
    typeof data.passage === "string" ? data.passage.trim() : "";
  const audioScript =
    (typeof data.audioScript === "string" ? data.audioScript.trim() : "")
    || (typeof data.audio_script === "string" ? data.audio_script.trim() : "");

  const next = { ...data };
  if (!audioScript && passage) {
    next.audioScript = passage;
  }
  if ("passage" in next) {
    delete next.passage;
  }
  return next;
}
