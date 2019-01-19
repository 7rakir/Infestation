class Sine {
  constructor(amplitude, frequencyMultiplier, offsetX) {
    this.amplitude = amplitude;
    this.frequencyMultiplier = frequencyMultiplier;
    this.offsetX = offsetX;
    this.periodMultiplier = 1000;
    this.offsetXMultiplier = 0.1;
  }

  frequency() {
    return this.frequencyMultiplier / this.periodMultiplier;
  }

  period() {
    return this.periodMultiplier * 2 * Math.PI / this.frequencyMultiplier;
  }

  offset() {
    return this.offsetX * this.period() * this.offsetXMultiplier;
  }

  y(x) {
    return this.amplitude * Math.sin((x - this.offset()) * (this.frequencyMultiplier / this.periodMultiplier));
  }
}

class Terminal {
  constructor(onSync, audio) {
    this.onSync = onSync;

    const drawer = new CanvasDrawer("terminal");

    frequencyInput = new Input("frequency");
    frequencyInput.onChange = this.frequencyChanged.bind(this);
    amplitudeInput = new Input("amplitude");
    amplitudeInput.onChange = this.amplitudeChanged.bind(this);
    offsetInput = new Input("offset");
    offsetInput.onChange = this.offsetChanged.bind(this);

    this.currentSine = new Sine();
    this.checkSine = new Sine();

    this.initializeSines();

    const renderer = new Renderer(drawer);

    renderer.addEntity(new GridEntity(drawer, this.checkSine));

    const currentSineEntity = new SineEntity(drawer, this.currentSine, new Color(255, 0, 0));
    renderer.addEntity(currentSineEntity);
    audio.pulse.setPlayerCallback(currentSineEntity.startPulse.bind(currentSineEntity)); //TODO: these bind calls feels wrong
    audio.pulse.setPlayerFrequencyGetter(this.currentSine.frequency.bind(this.currentSine));
    const checkSineEntity = new SineEntity(drawer, this.checkSine, new Color(0, 255, 0, 0.3));
    renderer.addEntity(checkSineEntity);
    audio.pulse.setCheckCallback(checkSineEntity.startPulse.bind(checkSineEntity));
    audio.pulse.setCheckFrequencyGetter(this.checkSine.frequency.bind(this.checkSine));

    window.requestAnimationFrame(renderer.draw);
  }

  initializeSines() {
    this.currentSine.amplitude = (amplitudeInput.max + amplitudeInput.min) / 2;
    this.currentSine.frequencyMultiplier = (frequencyInput.max + frequencyInput.min) / 2;
    this.currentSine.offsetX = (offsetInput.max + offsetInput.min) / 2;

    amplitudeInput.value = this.currentSine.amplitude;
    frequencyInput.value = this.currentSine.frequencyMultiplier;
    offsetInput.value = this.currentSine.offset;

    const randomAmplitude = random(amplitudeInput.min, amplitudeInput.max, amplitudeInput.step);
    const randomFrequency = random(frequencyInput.min, frequencyInput.max, frequencyInput.step);
    const randomOffset = random(offsetInput.min, offsetInput.max, offsetInput.step);

    this.checkSine.amplitude = randomAmplitude;
    this.checkSine.frequencyMultiplier = randomFrequency;
    this.checkSine.offsetX = randomOffset;
  }

  frequencyChanged() {
    this.currentSine.frequencyMultiplier = frequencyInput.value;
    this.checkSynchronization();
  }

  amplitudeChanged() {
    this.currentSine.amplitude = amplitudeInput.value;
    this.checkSynchronization();
  }

  offsetChanged() {
    this.currentSine.offsetX = offsetInput.value;
    this.checkSynchronization();
  }

  checkSynchronization() {
    const frequenciesEqual = this.currentSine.frequencyMultiplier == this.checkSine.frequencyMultiplier;
    const amplitudesEqual = this.currentSine.amplitude == this.checkSine.amplitude;

    const offsetDifference = this.currentSine.offsetX - this.checkSine.offsetX;
    const offsetInSync = Math.abs(offsetDifference) == 10 || offsetDifference == 0;

    if (frequenciesEqual && amplitudesEqual && offsetInSync) {
      this.onSync();
    }
  }
}

function random(min, max, step = 1) {
  return min + (step * Math.floor(Math.random() * (max - min + 1) / step));
}