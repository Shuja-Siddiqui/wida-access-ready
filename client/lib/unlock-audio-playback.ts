/** Call synchronously inside a click/tap handler so later async TTS can play. */
export function unlockAudioPlayback(): void {
  try {
    const audio = new Audio();
    audio.muted = true;
    void audio
      .play()
      .then(() => {
        audio.pause();
        audio.currentTime = 0;
        audio.muted = false;
      })
      .catch(() => {
        audio.muted = false;
      });
  } catch {
    /* ignore */
  }
}
