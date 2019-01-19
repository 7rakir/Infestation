function createAudio() {
    function createMidiToFreqConverter (tuning) {
        tuning = tuning || 440
        return (midi) => {
            return midi === 0 || (midi > 0 && midi < 128) ? Math.pow(2, (midi - 69) / 12) * tuning : null
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
                if (loop.mute) {
                    return;
                }

                const stepParams = {...loop.seq[currentNote]};

                stepParams.time = grid.getStepTime((loop.length * currentLoop) + stepParams.step);

                if (!!stepParams.hold) {
                    stepParams.hold = stepParams.hold * grid.stepLength();
                }

                if (!!stepParams.callback) {
                    setTimeout(() => {
                        stepParams.callback();
                        //console.log(`time difference: ${(stepParams.time - audioContext.currentTime) * 1000}`);
                    }, Math.max(0, (stepParams.time - audioContext.currentTime) * 1000));
                }

                loop.instrument.play(stepParams);
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

    function envelope(param, time, volume, attack, hold, release) {
        param.cancelScheduledValues(time);
        param.setValueAtTime(0.0001, time);
        param.exponentialRampToValueAtTime(volume, time + attack);
        param.setValueAtTime(volume, time + hold);
        param.exponentialRampToValueAtTime(0.0001, time + hold + release);
        param.setValueAtTime(0.0001, time + hold + release);
    }

    function createPulse(ctx) {
        const osc = ctx.createOscillator();
        osc.start(ctx.currentTime);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.0001, ctx.currentTime);

        osc.connect(gain);

        return {
            play: (params) => {
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

    const pulseOptions = {
        playerCallback: () => {},
        playerFrequencyGetter: () => 440,
        checkCallback: () => {},
        checkFrequencyGetter: () => 220,
    }
    const pulse = {
        length: 16,
        seq: [
            {step: 0, freq: () => pulseOptions.checkFrequencyGetter() * 10000, callback: () => pulseOptions.checkCallback()},
            {step: 8, freq: () => pulseOptions.playerFrequencyGetter() * 10000, callback: () => pulseOptions.playerCallback()},
        ],
        instrument: createPulse(ctx),
    };
    pulse.instrument.connect(master);


    const s = scheduler(ctx, [pulse]);
    //s.setBPM(180);
    s.start();

    return {
        pulse: {
            setPlayerCallback: (func) => {
                pulseOptions.playerCallback = func;
            },
            setCheckCallback: (func) => {
                pulseOptions.checkCallback = func;
            },
            setPlayerFrequencyGetter: (func) => {
                pulseOptions.playerFrequencyGetter = func;
            },
            setCheckFrequencyGetter: (func) => {
                pulseOptions.checkFrequencyGetter = func;
            },
        },
    }
}