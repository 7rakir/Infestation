function createAudio() {
    function createMidiToFreqConverter (tuning) {
        tuning = tuning || 440
        return (midi) => {
            return midi === 0 || (midi > 0 && midi < 128) ? Math.pow(2, (midi - 69) / 12) * tuning : null
        }
    }

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

    function createSaw(audioContext) {
        const osc = audioContext.createOscillator();
        osc.type = "sawtooth";
        osc.start(0);
        return osc;
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
        for (let i = 0; i < 8; i++) {
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
                voices[currentVoice].oscFreq.setValueAtTime(params.freq(), params.time);
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

    function createPulse(ctx) {
        const osc = ctx.createOscillator();
        osc.start(ctx.currentTime);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.0001, ctx.currentTime);

        osc.connect(gain);

        return {
            play: (params) => {
                console.log(params.freq());
                osc.frequency.setValueAtTime(params.freq(), ctx.currentTime);
                envelope(gain.gain, ctx.currentTime, 1, 0.01, 0.3, 0.5);
            },
            connect: (destination) => {
                gain.connect(destination);
            },
        }
    }

    const ctx = new AudioContext();
    const conv = createMidiToFreqConverter();
    const master = ctx.createGain();
    master.gain.value = 0.3;
    master.connect(ctx.destination);

    const freqencyOffset = 60;

    const state = {
        pulse: {
            playerCallback: () => {},
            checkCallback: () => {},
            frequency: 0,
        },
        root: freqencyOffset,
        scale: majorScale(freqencyOffset),
    };

    const pulse = createLoopTrack(createPulse(ctx), {
        length: 16,
        pattern: [
            {step: 0, freq: () => state.scale[state.pulse.frequency], callback: () => state.pulse.checkCallback()},
            {step: 8, freq: () => state.scale[0], callback: () => state.pulse.playerCallback()},
        ],
    });
    pulse.instrument.connect(master);

    const arp = createLoopTrack(createSynthInstrument(ctx), {
        length: 8,
        pattern: [
            {step: 0, freq: () => state.scale[0], hold: 2},
            {step: 2, freq: () => state.scale[2], hold: 2},
            {step: 4, freq: () => state.scale[4], hold: 2},
            {step: 6, freq: () => state.scale[7], hold: 2},
        ],
    });
    arp.instrument.setFrequency(5000);
    arp.instrument.connect(master);


    const s = scheduler(ctx, [pulse, arp]);
    s.setBPM(170);
    s.start();

    return {
        pulse: {
            setPlayerCallback: (func) => {
                state.pulse.playerCallback = func;
            },
            setCheckCallback: (func) => {
                state.pulse.checkCallback = func;
            },
            setPlayerFrequency: (freq) => {
                state.pulse.frequency =  freq - (state.root - freqencyOffset);
                console.log(state.pulse.frequency);
            },
            setCheckFrequency: (freq) => {
                state.root = freqencyOffset + freq;
                state.scale = majorScale(state.root);
            },
        },
    }
}