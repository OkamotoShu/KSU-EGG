// タップ操作をきっかけに、短い効果音を端末内で合成する
export function createSoundEffects(characterType) {
  let context;
  const playTone = (frequency, start, duration, type = "sine", volume = 0.075) => {
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
        playTone(523, now + 0.12, 0.55, "sine", 0.06);
      } else {
        [523, 659, 784, 1047].forEach((note, index) => playTone(note, now + index * 0.12, 0.55, "sine", 0.06));
      }
    },
    // ひびが大きく入る瞬間の、乾いた殻の割れる音
    playCrack() {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      context ??= new AudioContextClass();
      void context.resume();
      const now = context.currentTime;
      const duration = 0.42;
      const buffer = context.createBuffer(1, Math.floor(context.sampleRate * duration), context.sampleRate);
      const samples = buffer.getChannelData(0);
      for (let index = 0; index < samples.length; index += 1) {
        const progress = index / samples.length;
        samples[index] = (Math.random() * 2 - 1) * Math.pow(1 - progress, 3.4);
      }
      const source = context.createBufferSource();
      const filter = context.createBiquadFilter();
      const gain = context.createGain();
      source.buffer = buffer;
      filter.type = "highpass";
      filter.frequency.setValueAtTime(650, now);
      gain.gain.setValueAtTime(0.24, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      source.connect(filter).connect(gain).connect(context.destination);
      source.start(now);
      playTone(150, now, 0.16, "square", 0.09);
      playTone(95, now + 0.06, 0.2, "triangle", 0.075);
    },
    close() { if (context && context.state !== "closed") void context.close(); },
  };
}
