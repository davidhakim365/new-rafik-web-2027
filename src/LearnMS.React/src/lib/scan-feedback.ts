/** Browser speech + short beep for barcode scan feedback. */

export function playScanSuccessVoice(
  message = "Barcode scanned successfully"
) {
  try {
    // Short confirmation beep first (works even if speech is blocked)
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (AudioCtx) {
      const ctx = new AudioCtx();
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = 880;
      gain.gain.value = 0.08;
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start();
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18);
      oscillator.stop(ctx.currentTime + 0.2);
      window.setTimeout(() => void ctx.close(), 300);
    }
  } catch {
    // ignore audio failures
  }

  try {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.rate = 1.05;
    utterance.pitch = 1;
    utterance.volume = 1;
    window.speechSynthesis.speak(utterance);
  } catch {
    // ignore speech failures
  }
}

export function playScanErrorVoice(message = "Scan failed") {
  try {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.rate = 1;
    utterance.pitch = 0.85;
    utterance.volume = 1;
    window.speechSynthesis.speak(utterance);
  } catch {
    // ignore
  }
}
