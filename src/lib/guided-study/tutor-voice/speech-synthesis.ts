/** Utilidades Web Speech API — cliente únicamente. */

export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(
    (window as Window & { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown })
      .SpeechRecognition ||
      (window as Window & { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition,
  );
}

export function pickSpanishVoice(): SpeechSynthesisVoice | null {
  if (!isSpeechSynthesisSupported()) return null;
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find(
    (v) =>
      v.lang.startsWith("es") &&
      (/peru|españa|mexico|latam|google|natural|premium/i.test(v.name) || v.localService),
  );
  return (
    preferred ??
    voices.find((v) => v.lang.startsWith("es-PE") || v.lang.startsWith("es-MX")) ??
    voices.find((v) => v.lang.startsWith("es")) ??
    null
  );
}

let cachedVoice: SpeechSynthesisVoice | null = null;

export function getCachedSpanishVoice(): SpeechSynthesisVoice | null {
  return cachedVoice ?? pickSpanishVoice();
}

export function primeSpanishVoice(): Promise<SpeechSynthesisVoice | null> {
  return waitForVoices().then((voice) => {
    cachedVoice = voice;
    return voice;
  });
}

export function waitForVoices(timeoutMs = 2000): Promise<SpeechSynthesisVoice | null> {
  return new Promise((resolve) => {
    if (!isSpeechSynthesisSupported()) {
      resolve(null);
      return;
    }

    const existing = pickSpanishVoice();
    if (existing) {
      cachedVoice = existing;
      resolve(existing);
      return;
    }

    const timer = window.setTimeout(() => {
      const v = pickSpanishVoice();
      cachedVoice = v;
      resolve(v);
    }, timeoutMs);

    window.speechSynthesis.onvoiceschanged = () => {
      window.clearTimeout(timer);
      const v = pickSpanishVoice();
      cachedVoice = v;
      resolve(v);
    };
  });
}
