function createAudio() {
    const ctx = new AudioContext();

    function envelope(param, time, volume, attack, hold, release) {
        param.cancelScheduledValues(time);
        param.setValueAtTime(0.0001, time);
        param.exponentialRampToValueAtTime(volume, time + attack);
        param.setValueAtTime(volume, time + hold);
        param.exponentialRampToValueAtTime(0.0001, time + hold + release);
        param.setValueAtTime(0.0001, time + hold + release);
    }

    function createPulse() {
        const osc = ctx.createOscillator();
        osc.start(ctx.currentTime);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.0001, ctx.currentTime);

        osc.connect(gain);
        gain.connect(ctx.destination);

        return {
            play: (freq) => {
                osc.frequency.setValueAtTime(freq, ctx.currentTime);
                envelope(gain.gain, ctx.currentTime, 1, 0.01, 0.3, 0.5);
            }
        }
    }

    const pulse = createPulse();

    return {
        playPulse: (freq) => {
            pulse.play(freq * 10000);
        }
    }
}