function createAudio() {
    function majorScale(root) {
        function midiToFreq (midi) {
            const tuning = 440;
            return midi === 0 || (midi > 0 && midi < 128) ? Math.pow(2, (midi - 69) / 12) * tuning : null
        }

        const steps = [2, 2, 1, 2, 2, 2, 1];
        const scale = {};
        scale[0]=root;
        for(let i = 1; i<=Math.floor((127-root)-((127-root)/12)*(12-steps.length)); i++){
            scale[i]=scale[i-1] + steps[(i-1)%steps.length];
        }
        for(let i = -1; i>-Math.floor(root-(root/12)*(12-7)); i--) {
            let index = steps.length+i%(steps.length);
            if (index >= steps.length) {
                index = 0;
            }
            scale[i]= scale[i+1] - steps[index];
        }

        for(const prop in scale) {
            scale[prop] = midiToFreq(scale[prop]);
        }

        return scale;
    }

    function createOneShotTrack(instrument, pattern) {
        let currentNote = 0;

        return {
            instrument: instrument,
            mute: false,
            getCurrentNoteParams: () => {
                if (currentNote >= pattern.length) {
                    return null;
                }
                return pattern[currentNote];
            },
            nextNote: () => {
                currentNote++;
            },
            reset: () => {
                currentNote = 0;
            },
        }
    }

    function createLoopTrack(instrument, loop) {
        let currentLoop = 0;
        let currentNote = 0;

        return {
            instrument: instrument,
            mute: false,
            getCurrentNoteParams: () => {
                return {
                    ...loop.pattern[currentNote],
                    step: (currentLoop * loop.length) + loop.pattern[currentNote].step
                }
            },
            nextNote: () => {
                currentNote++;
                if (currentNote >= loop.pattern.length){
                    currentNote = 0;
                    currentLoop++;
                }
            },
            reset: () => {
                currentLoop = 0;
                currentNote = 0;
            },
        }
    }

    function scheduler(audioContext, tracks) {

        function createGrid() {
            let bpm = 130;
            let currentStep = 0;
            let currentTime = 0;

            function stepLength() {
                return 15 / bpm;
            }

            return {
                reset: () => {
                    currentStep = 0;
                    currentTime = audioContext.currentTime;
                },
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

        function trackScheduler(track){
            function scheduleNextNote(){
                if (!track.mute) {
                    const noteParams = track.getCurrentNoteParams();
                    if (noteParams == null) {
                        return;
                    }

                    noteParams.time = grid.getStepTime(noteParams.step);

                    if (!!noteParams.hold) {
                        noteParams.hold = noteParams.hold * grid.stepLength();
                    }

                    if (!!noteParams.callback) {
                        setTimeout(() => {
                            noteParams.callback();
                            //console.log(`time difference: ${(stepParams.time - audioContext.currentTime) * 1000}`);
                        }, Math.max(0, (noteParams.time - audioContext.currentTime) * 1000));
                    }

                    track.instrument.play(noteParams);
                }
                track.nextNote();
            }

            function getNextNoteTime(){
                const noteParams = track.getCurrentNoteParams();
                if (noteParams == null) {
                    return Number.MAX_VALUE;
                }
                return grid.getStepTime(noteParams.step);
            }

            return {
                schedule: () => {
                    while (getNextNoteTime() < audioContext.currentTime + scheduleAheadTime ) {
                        scheduleNextNote();
                    }
                },
            }
        }

        const trackSchedulers = tracks.map(track => trackScheduler(track));

        let timerId = null;

        return {
            stop: () => {
                clearInterval(timerId);
            },
            start: () => {
                grid.reset();
                tracks.forEach(track => track.reset());
                timerId = setInterval(() => {
                    grid.update();
                    trackSchedulers.forEach(scheduler => scheduler.schedule());
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

    function envelope(param, time, volume, attack, hold, release) {
        param.cancelScheduledValues(time);
        param.setValueAtTime(0.0001, time);
        param.exponentialRampToValueAtTime(volume, time + attack);
        param.setValueAtTime(volume, time + hold);
        param.exponentialRampToValueAtTime(0.0001, time + hold + release);
        param.setValueAtTime(0.0001, time + hold + release);
    }

    function createImpulseResponse(audioContext, duration, decay, reverse) {
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

    function createSquare(audioContext) {
        const osc = audioContext.createOscillator();
        osc.type = "square";
        osc.start(0);
        return osc;
    }

    function createSynthInstrument(audioContext, oscFactory) {

        function createVoice(audioContext) {
            const osc = oscFactory(audioContext);
            osc.frequency.value = 0;

            const gainNode = audioContext.createGain();
            gainNode.gain.setValueAtTime(0.0001, audioContext.currentTime);

            osc.connect(gainNode);

            const oscFreqControl = audioContext.createConstantSource();
            oscFreqControl.start(audioContext.currentTime);
            oscFreqControl.connect(osc.frequency);

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
        for (let i = 0; i < 8; i++) {
            const voice = createVoice(audioContext);
            voice.connect(filter);
            voices.push(voice);
        }

        let currentVoice = -1;
        let volume = 0.1;
        return {
            play: (params) => {
                const attack = 0.01;
                const release = 1;

                currentVoice++;
                if (currentVoice >= voices.length) {
                    currentVoice = 0;
                }

                voices[currentVoice].oscFreq.cancelScheduledValues(params.time);
                voices[currentVoice].oscFreq.setValueAtTime(params.freq(), params.time);
                envelope(voices[currentVoice].gain, params.time, volume, attack, params.hold, release);
            },
            setFrequency: (freq) => {
                filter.frequency.linearRampToValueAtTime(freq, audioContext.currentTime + 0.1);
            },
            setVolume: (vol) => {
                volume = vol;
            },
            connect: (destination) => {
                gainNode.connect(destination);
            }
        }
    }

    function createPulse(ctx) {
        const osc = createSquare(ctx);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.0001, ctx.currentTime);
        osc.connect(gain);

        const outVolume = ctx.createGain();
        outVolume.gain.value = 0.2;
        gain.connect(outVolume);

        return {
            play: (params) => {
                osc.frequency.setValueAtTime(params.freq(), ctx.currentTime);
                envelope(gain.gain, ctx.currentTime, 1, 0.01, 0.3, 0.5);
            },
            connect: (destination) => {
                outVolume.connect(destination);
            },
        }
    }

    function createPewPewPew(ctx) {

        function createVoice() {
            const osc = ctx.createOscillator();
            osc.type = "sine";
            osc.frequency.value = 1000;
            osc.start();
            const gain = ctx.createGain();
            gain.gain.value = 0.000001;
            osc.connect(gain);

            return {
                frequency: osc.frequency,
                gain: gain.gain,
                connect: (destination) => {
                    gain.connect(destination);
                },
            }
        }

        const master = ctx.createGain();

        const voices = [];
        for (let i = 0; i < 8; i++) {
            const voice = createVoice(ctx);
            voice.connect(master);
            voices.push(voice);
        }
        let currentVoice = -1;

        return {
            play: () => {
                currentVoice++;
                if (currentVoice >= voices.length) {
                    currentVoice = 0;
                }

                const time = ctx.currentTime;
                voices[currentVoice].frequency.cancelScheduledValues(time);
                const randomUp = Math.floor(Math.random() * 2000);
                const randomDown = Math.floor(Math.random() * 100);
                voices[currentVoice].frequency.setValueAtTime(randomUp + 3000, time);
                voices[currentVoice].frequency.exponentialRampToValueAtTime(randomDown + 50, time + 0.7);
                voices[currentVoice].gain.cancelScheduledValues(time);
                voices[currentVoice].gain.setValueAtTime(0.0000001, time);
                voices[currentVoice].gain.exponentialRampToValueAtTime(0.5, time + 0.01);
                voices[currentVoice].gain.setValueAtTime(0.5, time + 0.01);
                voices[currentVoice].gain.exponentialRampToValueAtTime(0.000001, time + 1.5);
            },
            connect: (destination) => {
                master.connect(destination);
            },
        }
    }

    function createExplosion(ctx) {
        const noise = createWhiteNoise(ctx);
        const gain = ctx.createGain();
        gain.gain.value = 0.00001;
        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = 800;
        const sweep = ctx.createBiquadFilter();
        sweep.type = "peaking";
        sweep.Q = 10;
        sweep.gain.value = 10;
        sweep.frequency.value = 2000;
        noise.connect(filter);
        filter.connect(gain);
        filter.connect(sweep);
        sweep.connect(gain);

        return {
            play: () => {
                const time = ctx.currentTime;
                gain.gain.cancelScheduledValues(time);
                gain.gain.setValueAtTime(0.00001, time);
                gain.gain.exponentialRampToValueAtTime(2, time + 0.01);
                gain.gain.setValueAtTime(2, time + 0.01);
                gain.gain.exponentialRampToValueAtTime(0.00001, time + 4);

                sweep.frequency.cancelScheduledValues(time);
                sweep.frequency.setValueAtTime(2000, time);
                sweep.frequency.exponentialRampToValueAtTime(100, time + 1);
            },
            connect: (destination) => {
                gain.connect(destination);
            },
        }
    }

    function createNoiseDown(ctx) {
        const osc = createWhiteNoise(ctx);
        const filter = ctx.createBiquadFilter();
        filter.type = "bandpass";
        filter.Q = 10;
        filter.frequency.value = 10000;
        const gain = ctx.createGain();
        gain.gain.value = 0.00001;
        osc.connect(filter);
        filter.connect(gain);

        return {
            play: () => {
                const time = ctx.currentTime;
                gain.gain.cancelScheduledValues(time);
                gain.gain.setValueAtTime(0.00001, time);
                gain.gain.exponentialRampToValueAtTime(1, time + 0.1);
                gain.gain.setValueAtTime(1, time + 1);
                gain.gain.exponentialRampToValueAtTime(0.00001, time + 4);
                gain.gain.setValueAtTime(0.00001, time + 4);

                filter.frequency.cancelScheduledValues(time);
                filter.frequency.setValueAtTime(20000, time);
                filter.frequency.exponentialRampToValueAtTime(200, time + 3);
            },
            connect: (destination) => {
                gain.connect(destination);
            },
        }
    }

    const ctx = new AudioContext();
    const masterGain = ctx.createGain();
    masterGain.gain.value = 0.3;
    masterGain.connect(ctx.destination);

    var convolver = ctx.createConvolver();
    convolver.buffer = createImpulseResponse(ctx, 0.7, 2);
    convolver.normalize = false;
    const convolverGain = ctx.createGain();
    convolverGain.gain.setValueAtTime(0.5, ctx.currentTime);
    convolver.connect(convolverGain);
    convolverGain.connect(masterGain);

    const preGain = ctx.createGain();
    preGain.gain.setValueAtTime(1, ctx.currentTime);
    preGain.connect(convolver);
    preGain.connect(masterGain);

    const freqencyOffset = 60;

    const state = {
        pulse: {
            playerCallback: () => {},
            checkCallback: () => {},
            frequency: 0,
            note: 0,
        },
        root: freqencyOffset,
        scale: majorScale(freqencyOffset),
    };

    const pulseGain = ctx.createGain();
    pulseGain.connect(preGain);
    const pulse = createLoopTrack(createPulse(ctx), {
        length: 32,
        pattern: [
            {step: 0, freq: () => state.scale[state.pulse.note], callback: () => state.pulse.playerCallback()},
            {step: 16, freq: () => state.scale[0], callback: () => state.pulse.checkCallback()},
        ],
    });
    pulse.instrument.connect(pulseGain);


    const musicGain = ctx.createGain();

    const arp = (function() {
        const steps = [0, 2, 4, 6];
        let stepsIndex = 0;
        let stepsLoopCounter = 0;

        const chord = [0, 2, 4, 7];
        let chordIndex = 0;

        const progression = [0, 0, 0, 0, -3, -3, -3, -3, 4, 4, 2, 2];
        let progressionIndex = 0;

        return {
            instrument: createSynthInstrument(ctx, createSquare),
            getCurrentNoteParams: () => {
                return {
                    step: (8 * stepsLoopCounter) + steps[stepsIndex],
                    freq: () => state.scale[chord[chordIndex] + progression[progressionIndex] - 7],
                    hold: 2
                };
            },
            nextNote: () => {
                stepsIndex++;
                if (stepsIndex >= steps.length) {
                    stepsLoopCounter++;
                    stepsIndex = 0;
                }
                chordIndex++;
                if (chordIndex >= chord.length) {
                    chordIndex = 0;
                    progressionIndex++;
                    if (progressionIndex >= progression.length) {
                        progressionIndex = 0;
                    }
                }
            },
            reset: () => {
                stepsLoopCounter = 0;
                chordIndex = 0;
                progressionIndex = 0;
            },
        };
    })();
    arp.instrument.setFrequency(5000);
    arp.instrument.setVolume(0.08);
    arp.instrument.connect(musicGain);

    const bass = (function() {
        const steps = [0, 2, 4, 6];
        let stepsIndex = 0;
        let stepsLoopCounter = 0;

        const chord = [0, 7, 0, 7];
        let chordIndex = 0;

        const progression = [0, 0, 0, 0, -3, -3, -3, -3, 4, 4, 2, 2];
        let progressionIndex = 0;

        return {
            instrument: createSynthInstrument(ctx, createSaw),
            getCurrentNoteParams: () => {
                return {
                    step: (8 * stepsLoopCounter) + steps[stepsIndex],
                    freq: () => state.scale[chord[chordIndex] + progression[progressionIndex] - 21],
                    hold: 1
                };
            },
            nextNote: () => {
                stepsIndex++;
                if (stepsIndex >= steps.length) {
                    stepsLoopCounter++;
                    stepsIndex = 0;
                }
                chordIndex++;
                if (chordIndex >= chord.length) {
                    chordIndex = 0;
                    progressionIndex++;
                    if (progressionIndex >= progression.length) {
                        progressionIndex = 0;
                    }
                }
            },
            reset: () => {
                stepsLoopCounter = 0;
                chordIndex = 0;
                progressionIndex = 0;
            },
        };
    })();
    bass.instrument.setFrequency(880);
    bass.instrument.connect(musicGain);

    const musicFilter = ctx.createBiquadFilter();
    musicFilter.type = "lowpass";
    musicFilter.frequency.value = 20000;
    musicFilter.Q.value = 10;
    musicGain.connect(musicFilter);
    musicFilter.connect(preGain);

    const s = scheduler(ctx, [pulse, arp, bass]);
    s.start();
    const initialBpm = 155;
    let speedUpTimer = null;

    // https://stackoverflow.com/questions/21513706
    window.speechSynthesis.getVoices();

    const pewPewPew = createPewPewPew(ctx);
    pewPewPew.connect(preGain);

    const noiseDown = createNoiseDown(ctx);
    noiseDown.connect(preGain);

    const explosion = createExplosion(ctx);
    explosion.connect(preGain);

    return {
        pulse: {
            setPlayerCallback: (func) => {
                state.pulse.playerCallback = func;
            },
            setCheckCallback: (func) => {
                state.pulse.checkCallback = func;
            },
            setPlayerFrequency: (freq) => {
                state.pulse.frequency = freq;
                state.pulse.note =  freq - (state.root - freqencyOffset);
            },
            setCheckFrequency: (freq) => {
                state.root = freqencyOffset + freq;
                state.scale = majorScale(state.root);
                state.pulse.note =  state.pulse.frequency - (state.root - freqencyOffset);
            },
        },
        unlocked: () => {
            const synth = window.speechSynthesis;
            var msg = new SpeechSynthesisUtterance();
            const voice = synth.getVoices().filter(v => v.name == "Google UK English Female")[0];
            if (!!voice) {
                msg.voice = voice;
                msg.pitch = 0.7;
            }
            msg.text = "Doors unlocked!"
            synth.speak(msg);
        },
        squadEnteringSector: () => {
            pulseGain.gain.exponentialRampToValueAtTime(1, ctx.currentTime + 0.001);
            musicFilter.frequency.setValueAtTime(400, ctx.currentTime);
            musicFilter.frequency.exponentialRampToValueAtTime(15000, ctx.currentTime + 1);

            if (speedUpTimer == null) {
                let bpm = initialBpm;
                s.setBPM(bpm);
                speedUpTimer = setInterval(() => {
                    if (bpm >= 185) {
                        clearInterval(speedUpTimer);
                        speedUpTimer = null;
                    }
                    bpm++;
                    s.setBPM(bpm);
                }, 700);
            }
        },
        squadLeavingSector: () => {
            pulseGain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.001);
            noiseDown.play();
            musicFilter.frequency.setValueAtTime(15000, ctx.currentTime);
            musicFilter.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.8);

            if (speedUpTimer != null) {
                clearInterval(speedUpTimer);
                speedUpTimer = null;
            }
        },
        fire: () => {
            pewPewPew.play();
        },
        marineDied: () => {
            const synth = window.speechSynthesis;
            var msg = new SpeechSynthesisUtterance();
            const voice = synth.getVoices().filter(v => v.name == "Google UK English Female")[0];
            if (!!voice) {
                msg.voice = voice;
                msg.pitch = 0.7;
            }
            msg.text = "Marine died!"
            synth.speak(msg);
        },
        alienDied: () => {
            explosion.play();
        },
        gameOver: (isPositiveEnding) => {
            pulseGain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.001);
            musicFilter.frequency.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.8);
            let pattern;
            if (isPositiveEnding) {
                pattern = createOneShotTrack(createSynthInstrument(ctx, createSaw), [
                    { step: 0,  freq: () => state.scale[0], hold: 1 },
                    { step: 2,  freq: () => state.scale[4], hold: 1 },
                    { step: 4,  freq: () => state.scale[2], hold: 1 },
                    { step: 6,  freq: () => state.scale[7], hold: 1 },
                    { step: 8,  freq: () => state.scale[4], hold: 1 },
                    { step: 10, freq: () => state.scale[9], hold: 1 },
                    { step: 12, freq: () => state.scale[7], hold: 1 },
                    { step: 14, freq: () => state.scale[11], hold: 1 },
                ]);
            } else {
                pattern = createOneShotTrack(createSynthInstrument(ctx, createSaw), [
                    { step: 0,  freq: () => state.scale[11], hold: 1 },
                    { step: 2,  freq: () => state.scale[7], hold: 1 },
                    { step: 4,  freq: () => state.scale[9], hold: 1 },
                    { step: 6,  freq: () => state.scale[4], hold: 1 },
                    { step: 8,  freq: () => state.scale[7], hold: 1 },
                    { step: 10, freq: () => state.scale[2], hold: 1 },
                    { step: 12, freq: () => state.scale[4], hold: 1 },
                    { step: 14, freq: () => state.scale[0], hold: 1 },
                ]);
            }
            pattern.instrument.connect(preGain);

            var s = scheduler(ctx, [pattern]);
            s.setBPM(180);
            s.start();
        },
    }
}