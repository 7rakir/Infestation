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

            osc1.frequency.value = 0;
            osc2.frequency.value = 0;
            osc3.frequency.value = 0;

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

        function createGrid() {
            let bpm = 130;
            let currentStep = 0;
            let currentTime = 0;

            function stepLength() {
                return 15 / bpm;
            }

            return {
                getStepTime: (step) => {
                    const diff = step - currentStep;
                    return currentTime + (diff * stepLength());
                },
                update: () => {
                    if (currentTime < audioContext.currentTime) {
                        currentStep++;
                        currentTime += stepLength();
                    }
                },
                setBPM: (newBPM) => {
                    bpm = newBPM;
                },
                getBPM: () => {
                    return bpm;
                },
                stepLength: () => {
                    return stepLength();
                }
            };
        }

        const lookahead = 25.0;         // milliseconds
        const scheduleAheadTime = 0.1;  // seconds
        const grid = createGrid();

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
                    const patternParams = loop.seq[currentNote];
                    const timeParams = {...patternParams, time: grid.getStepTime((loop.length * currentLoop) + patternParams.step)}
                    if (!!timeParams.hold) {
                        timeParams.hold = timeParams.hold * grid.stepLength();
                    }
                    loop.instrument.play(timeParams);
                }
            }

            function getNextNoteTime(){
                let next = currentNote + 1;
                let l = currentLoop;
                if (next >= loop.seq.length){
                    next = 0;
                    l++;
                }

                return grid.getStepTime((loop.length * l) + loop.seq[next].step);
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

        let timerId = null;

        return {
            stop: () => {
                clearInterval(timerId);
            },
            start: () => {
                timerId = setInterval(() => {
                    grid.update();
                    loopSchedulers.forEach(w => w.schedule());
                }, lookahead);
            },
            setBPM: (newBPM) => {
                grid.setBPM(newBPM);
            },
            getBPM: () => {
                return grid.getBPM();
            },
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
        length: 64,
        seq: [
            {freq: conv(60), step: 0, hold: 2},
            {freq: conv(69), step: 4, hold: 1},
            {freq: conv(60), step: 8, hold: 4},
            {freq: conv(69), step: 16, hold: 4},
            {freq: conv(69), step: 22, hold: 1},
            {freq: conv(69), step: 30, hold: 1},
            {freq: conv(60), step: 32+0, hold: 2},
            {freq: conv(69), step: 32+4, hold: 1},
            {freq: conv(60), step: 32+8, hold: 4},
            {freq: conv(67), step: 32+16, hold: 4},
            {freq: conv(67), step: 32+22, hold: 1},
            {freq: conv(67), step: 32+30, hold: 1},
        ],
        instrument: createSynthInstrument(audioContext),
    };
    synth.instrument.connect(preGain);

    const bass = {
        length: 32,
        seq: [
            {freq: conv(24), step: 0, hold: 3},
            {freq: conv(24), step: 6, hold: 3},
            {freq: conv(24), step: 10, hold: 3},
            {freq: conv(28), step: 16, hold: 3},
            {freq: conv(28), step: 22, hold: 3},
            {freq: conv(28), step: 26, hold: 3},
        ],
        instrument: createSynthInstrument(audioContext),
    };
    bass.instrument.connect(preGain);

    const hihat = {
        length: 16,
        seq: [
            {step: 2},
            {step: 8},
            {step: 14},
        ],
        instrument: createHiHatInstrument(audioContext),
    };
    hihat.instrument.connect(preGain);

    const kick = {
        length: 16,
        seq: [
            {step: 0},
            {step: 6},
            {step: 10},
        ],
        instrument:  createKickInstrument(audioContext),
    };
    kick.instrument.connect(preGain);

    const snare = {
        length: 8,
        seq: [
            {step: 4},
        ],
        instrument: createSnareInstrument(audioContext),
    };
    snare.instrument.connect(preGain);

    const s = scheduler(audioContext, [kick, hihat, snare, synth, bass]);
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

    document.getElementById("play-bass").addEventListener("change", (e) => {
        bass.mute = !e.srcElement.checked;
    });

    document.getElementById("bpm").addEventListener("change", (e) => {
        s.setBPM(e.srcElement.value);
    });
}
