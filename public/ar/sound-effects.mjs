// タップ操作をきっかけに、短い効果音を端末内で合成する
export function createSoundEffects(characterType) {
  let context;
  const playTone = (frequency, start, duration, type = "sine", volume = 0.045) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.03);
  };
  return {
    play() {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      context ??= new AudioContextClass();
      void context.resume();
      const now = context.currentTime;
      if (characterType === 1) {
        [392, 494, 587, 784].forEach((note, index) => playTone(note, now + index * 0.1, 0.2, "triangle"));
      } else if (characterType === 2) {
        playTone(392, now, 0.45, "sine");
        playTone(523, now + 0.12, 0.55, "sine", 0.035);
      } else {
        [523, 659, 784, 1047].forEach((note, index) => playTone(note, now + index * 0.12, 0.55, "sine", 0.035));
      }
    },
    close() { if (context && context.state !== "closed") void context.close(); },
  };
}
