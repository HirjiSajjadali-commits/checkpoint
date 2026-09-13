let ctx: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtor) return null;
  if (!ctx) ctx = new AudioCtor();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function tone(freq: number, startOffset: number, duration: number, type: OscillatorType, peakGain: number) {
  const ac = getContext();
  if (!ac) return;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  const t0 = ac.currentTime + startOffset;
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(peakGain, t0 + 0.006);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(gain).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

export function playMoveSound() {
  tone(440, 0, 0.09, 'sine', 0.18);
}

export function playCaptureSound() {
  tone(320, 0, 0.06, 'square', 0.14);
  tone(220, 0.05, 0.09, 'square', 0.12);
}

export function playCheckSound() {
  tone(880, 0, 0.08, 'sine', 0.2);
  tone(1046, 0.09, 0.1, 'sine', 0.2);
}

export function playGameEndSound() {
  tone(523, 0, 0.14, 'sine', 0.2);
  tone(659, 0.13, 0.14, 'sine', 0.2);
  tone(392, 0.26, 0.24, 'sine', 0.22);
}
