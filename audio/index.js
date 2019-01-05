// Some numbers:
// 12 semitones = 1 octave
// 100 cents = 1 semitone

const run = () => {

    function createMidiToFreqConverter (tuning) {
        tuning = tuning || 440
        return (midi) => {
            return midi === 0 || (midi > 0 && midi < 128) ? Math.pow(2, (midi - 69) / 12) * tuning : null
        }
    }

    function envelope(param, time, volume, attack, hold, release) {
        param.cancelScheduledValues(time);
        param.setValueAtTime(0.0001, time);
        param.exponentialRampToValueAtTime(volume, time + attack);
        param.setValueAtTime(volume, time + hold);
        param.exponentialRampToValueAtTime(0.0001, time + hold + release);
        param.setValueAtTime(0.0001, time + hold + release);
    }

    function createWhiteNoise(audioContext) {
        const bufferSize = 2 * audioContext.sampleRate;
        const noiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }

        const whiteNoise = audioContext.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;
        whiteNoise.start(0);

        return whiteNoise;
    }

    function createSine(audioContext) {
        const osc = audioContext.createOscillator();
        osc.type = "sine";
        osc.start(0);
        return osc;
    }

    function createSaw(audioContext) {
        const osc = audioContext.createOscillator();
        osc.type = "sawtooth";
        osc.start(0);
        return osc;
    }

    function createHiHatInstrument(audioContext) {
        const oscNoise = createWhiteNoise(audioContext);

        var filter = audioContext.createBiquadFilter();
        filter.type = "highpass";
        filter.frequency.setValueAtTime(4000, audioContext.currentTime);

        const gainNode = audioContext.createGain();
        gainNode.gain.setValueAtTime(0.0001, audioContext.currentTime);
        oscNoise.connect(filter);
        filter.connect(gainNode);

        return {
            play: (params) => {
                const volume = 0.9;
                const attack = 0.01;
                const hold = 0.01;
                const release = 0.3;
                envelope(gainNode.gain, params.time, volume, attack, hold, release);
            },
            connect: (destination) => {
                gainNode.connect(destination);
            }
        }
    }

    function createSnareInstrument(audioContext) {
        const oscNoise = createWhiteNoise(audioContext);

        var filter = audioContext.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(0.0001, audioContext.currentTime);

        const gainNode = audioContext.createGain();
        gainNode.gain.setValueAtTime(0.0001, audioContext.currentTime);
        oscNoise.connect(filter);
        filter.connect(gainNode);

        return {
            play: (params) => {
                const volume = 0.7;
                const attack = 0.01;
                const hold = 0.05;
                const release = 0.6;
                envelope(gainNode.gain, params.time, volume, attack, hold, release);
                envelope(filter.frequency, params.time, 20000, 0.0001, 0.1, 0.8);
            },
            connect: (destination) => {
                gainNode.connect(destination);
            }
        }
    }

    function createKickInstrument(audioContext) {
        const osc = createSine(audioContext);
        osc.frequency.setValueAtTime(50, audioContext.currentTime);
        const noise = createWhiteNoise(audioContext);

        var filter = audioContext.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(60, audioContext.currentTime);

        const gainNode = audioContext.createGain();
        gainNode.gain.setValueAtTime(0.0001, audioContext.currentTime);
        osc.connect(filter);
        noise.connect(filter)
        filter.connect(gainNode);

        return {
            play: (params) => {
                const volume = 0.9;
                const attack = 0.001;
                const hold = 0.01;
                const release = 0.1;
                envelope(gainNode.gain, params.time, volume, attack, hold, release);
            },
            connect: (destination) => {
                gainNode.connect(destination);
            }
        }
    }

    function createSynthInstrument(audioContext) {

        function createVoice(audioContext) {
            const osc1 = createSaw(audioContext);
            const osc2 = createSaw(audioContext);
            const osc3 = createSaw(audioContext);

            osc2.detune.setValueAtTime(1200, audioContext.currentTime);
            osc3.detune.setValueAtTime(1900, audioContext.currentTime);

            osc1.frequency.value = 1;
            osc2.frequency.value = 1;
            osc3.frequency.value = 1;

            const gainNode = audioContext.createGain();
            gainNode.gain.setValueAtTime(0.0001, audioContext.currentTime);

            osc1.connect(gainNode);
            osc2.connect(gainNode);
            osc3.connect(gainNode);

            const oscFreqControl = audioContext.createConstantSource();
            oscFreqControl.start(audioContext.currentTime);
            oscFreqControl.connect(osc1.frequency);
            oscFreqControl.connect(osc2.frequency);
            oscFreqControl.connect(osc3.frequency);

            return {
                oscFreq: oscFreqControl.offset,
                gain: gainNode.gain,
                connect: (destination) => { gainNode.connect(destination); },
            }
        }

        var filter = audioContext.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(22000, audioContext.currentTime);
        filter.Q.value = 15;

        const gainNode = audioContext.createGain();
        //gainNode.gain.setValueAtTime(0.0001, audioContext.currentTime);
        filter.connect(gainNode);

        const voices = [];
        for (let i = 0; i < 5; i++) {
            const voice = createVoice(audioContext);
            voice.connect(filter);
            voices.push(voice);
        }

        let currentVoice = -1;

        return {
            play: (params) => {
                const volume = 0.1;
                const attack = 0.01;
                const release = 1;

                currentVoice++;
                if (currentVoice >= voices.length) {
                    currentVoice = 0;
                }

                voices[currentVoice].oscFreq.cancelScheduledValues(params.time);
                voices[currentVoice].oscFreq.setValueAtTime(params.freq, params.time);
                envelope(voices[currentVoice].gain, params.time, volume, attack, params.hold, release);
            },
            setFrequency: (freq) => {
                filter.frequency.linearRampToValueAtTime(freq, audioContext.currentTime + 0.1);
            },
            connect: (destination) => {
                gainNode.connect(destination);
            }
        }
    }

    function scheduler(audioContext, loops) {
        const lookahead = 25.0;         // milliseconds
        const scheduleAheadTime = 0.1;  // seconds
        let timerId = null;

        function loopScheduler(loop){
            let currentLoop = 0;
            let currentNote = -1;

            function scheduleNextNote(){
                currentNote++;
                if (currentNote >= loop.seq.length){
                    currentNote = 0;
                    currentLoop++;
                }
                if (!loop.mute) {
                    const params = loop.seq[currentNote];
                    loop.instrument.play({...params, time: (loop.duration * currentLoop) + params.time});
                }
            }

            function getNextNoteTime(){
                let next = currentNote + 1;
                let l = currentLoop;
                if (next >= loop.seq.length){
                    next = 0;
                    l++;
                }
                return (loop.duration * l) + loop.seq[next].time;
            }

            return {
                schedule: () => {
                    while (getNextNoteTime() < audioContext.currentTime + scheduleAheadTime ) {
                        scheduleNextNote();
                    }
                },
            }
        }

        const loopSchedulers = loops.map(loop => loopScheduler(loop));

        return {
            stop: () => {
                clearInterval(timerId);
            },
            start: () => {
                timerId = setInterval(() => {
                    loopSchedulers.forEach(w => w.schedule());
                }, lookahead);
            }
        }
    }

    function impulseResponse(audioContext, duration, decay, reverse) {
        var sampleRate = audioContext.sampleRate;
        var length = sampleRate * duration;
        var impulse = audioContext.createBuffer(2, length, sampleRate);
        var impulseL = impulse.getChannelData(0);
        var impulseR = impulse.getChannelData(1);

        if (!decay)
            decay = 2.0;
        for (var i = 0; i < length; i++){
          var n = reverse ? length - i : i;
          impulseL[i] = (Math.random() * 2 - 1) * Math.pow(1 - n / length, decay);
          impulseR[i] = (Math.random() * 2 - 1) * Math.pow(1 - n / length, decay);
        }
        return impulse;
    }


    const audioContext = new AudioContext();

    const masterGain = audioContext.createGain();
    masterGain.gain.setValueAtTime(0.7, audioContext.currentTime);
    masterGain.connect(audioContext.destination);

    var convolver = audioContext.createConvolver();
    convolver.buffer = impulseResponse(audioContext, 0.7, 2);
    convolver.normalize = false;
    const convolverGain = audioContext.createGain();
    convolverGain.gain.setValueAtTime(0.5, audioContext.currentTime);
    convolver.connect(convolverGain);
    convolverGain.connect(masterGain);

    const preGain = audioContext.createGain();
    preGain.gain.setValueAtTime(1, audioContext.currentTime);
    preGain.connect(convolver);
    preGain.connect(masterGain);

    const conv = createMidiToFreqConverter();
    const synth = {
        duration: 4,
        seq: [
            {freq: conv(48), time: 0, hold: 1},
            {freq: conv(52), time: 1, hold: 1},
            {freq: conv(55), time: 2, hold: 1},
            {freq: conv(48), time: 2.5, hold: 0.5},
            {freq: conv(52), time: 3, hold: 0.5},
        ],
        instrument: createSynthInstrument(audioContext),
    };
    synth.instrument.connect(preGain);

    const hihat = {
        duration: 1,
        seq: [
            {time: 0.25},
            {time: 0.75},
        ],
        instrument: createHiHatInstrument(audioContext),
    };
    hihat.instrument.connect(preGain);

    const kick = {
        duration: 1,
        seq: [
            {time: 0},
            {time: 0.5},
        ],
        instrument:  createKickInstrument(audioContext),
    };
    kick.instrument.connect(preGain);

    const snare = {
        duration: 1,
        seq: [
            {time: 0.5},
        ],
        instrument: createSnareInstrument(audioContext),
    };
    snare.instrument.connect(preGain);

    const s = scheduler(audioContext, [kick, hihat, snare, synth]);
    s.start();

    document.getElementById("stop").onclick = () => {
        s.stop();
        audioContext.close();
    }

    document.getElementById("frequency").addEventListener("change", (e) => {
        synth.instrument.setFrequency(e.srcElement.value);
    });

    document.getElementById("volume").addEventListener("change", (e) => {
        masterGain.gain.linearRampToValueAtTime(e.srcElement.value / 1000, audioContext.currentTime + 0.01);
    });

    document.getElementById("reverb").addEventListener("change", (e) => {
        convolverGain.gain.linearRampToValueAtTime(e.srcElement.value / 1000, audioContext.currentTime + 0.01);
    });

    document.getElementById("play-kick").addEventListener("change", (e) => {
        kick.mute = !e.srcElement.checked;
    });

    document.getElementById("play-snare").addEventListener("change", (e) => {
        snare.mute = !e.srcElement.checked;
    });

    document.getElementById("play-hihat").addEventListener("change", (e) => {
        hihat.mute = !e.srcElement.checked;
    });

    document.getElementById("play-synth").addEventListener("change", (e) => {
        synth.mute = !e.srcElement.checked;
    });
}
