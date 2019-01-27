class Sine {
  constructor(amplitude, frequencyMultiplier, offsetX) {
    this.amplitude = amplitude;
    this.frequencyMultiplier = frequencyMultiplier;
    this.offsetX = offsetX;
    this.minimalFrequency = 3;
    this.periodMultiplier = 150;
    this.offsetXMultiplier = 0.1;
  }

  frequency() {
    return (this.minimalFrequency + this.frequencyMultiplier) / this.periodMultiplier;
  }

  period() {
    return this.periodMultiplier * 2 * Math.PI / (this.minimalFrequency + this.frequencyMultiplier);
  }

  offset() {
    return this.offsetX * this.period() * this.offsetXMultiplier;
  }

  y(x) {
    return this.amplitude * Math.sin((x - this.offset()) * ((this.minimalFrequency + this.frequencyMultiplier) / this.periodMultiplier));
  }
}

class Terminal {
  constructor(onSync, audio) {
    this.onSync = onSync;
    this.audio = audio;

    this.drawer = new CanvasDrawer("terminal");

    this.renderer = new Renderer(this.drawer);

    frequencyInput = new Input("frequency");
    frequencyInput.onChange = this.frequencyChanged.bind(this);
    amplitudeInput = new Input("amplitude");
    amplitudeInput.onChange = this.amplitudeChanged.bind(this);
    offsetInput = new Input("offset");
    offsetInput.onChange = this.offsetChanged.bind(this);

    this.currentSine = new Sine();
    this.checkSine = new Sine();

    this.gridEntity = new GridEntity(this.drawer, this.checkSine);

    this.currentSineEntity = new SineEntity(this.drawer, this.currentSine, new Color(255, 0, 0));
    this.checkSineEntity = new SineEntity(this.drawer, this.checkSine, new Color(0, 255, 0, 0.3));
    this.initializeSines();

    this.audio.pulse.setPlayerCallback(this.currentSineEntity.startPulse.bind(this.currentSineEntity));
    this.audio.pulse.setCheckCallback(this.checkSineEntity.startPulse.bind(this.checkSineEntity));

    window.requestAnimationFrame(this.renderer.draw);
  }

  initializeSines() {
    this.currentSine.amplitude = (amplitudeInput.max + amplitudeInput.min) / 2;
    this.currentSine.frequencyMultiplier = (frequencyInput.max + frequencyInput.min) / 2;
    this.currentSine.offsetX = (offsetInput.max + offsetInput.min) / 2;
    this.audio.pulse.setPlayerFrequency(this.currentSine.frequencyMultiplier);

    amplitudeInput.value = this.currentSine.amplitude;
    frequencyInput.value = this.currentSine.frequencyMultiplier;
    offsetInput.value = this.currentSine.offset;

    const randomAmplitude = random(amplitudeInput.min, amplitudeInput.max, amplitudeInput.step);
    const randomFrequency = random(frequencyInput.min, frequencyInput.max, frequencyInput.step);
    const randomOffset = random(offsetInput.min, offsetInput.max, offsetInput.step);

    this.checkSine.amplitude = randomAmplitude;
    this.checkSine.frequencyMultiplier = randomFrequency;
    this.checkSine.offsetX = randomOffset;
    this.audio.pulse.setCheckFrequency(randomFrequency);

    this.enableTerminal();
  }

  enableTerminal() {
    this.renderer.addEntity(this.gridEntity);
    this.renderer.addEntity(this.currentSineEntity);
    this.renderer.addEntity(this.checkSineEntity);
    frequencyInput.hidden = false;
    amplitudeInput.hidden = false;
    offsetInput.hidden = false;
  }

  disableTerminal() {
    this.renderer.removeEntity(this.gridEntity);
    this.renderer.removeEntity(this.currentSineEntity);
    this.renderer.removeEntity(this.checkSineEntity);
    frequencyInput.hidden = true;
    amplitudeInput.hidden = true;
    offsetInput.hidden = true;
  }

  disableControls() {
    frequencyInput.disabled = true;
    amplitudeInput.disabled = true;
    offsetInput.disabled = true;
  }

  enableControls() {
    frequencyInput.disabled = false;
    amplitudeInput.disabled = false;
    offsetInput.disabled = false;
  }

  frequencyChanged() {
    this.currentSine.frequencyMultiplier = frequencyInput.value;
    this.audio.pulse.setPlayerFrequency(frequencyInput.value);
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
