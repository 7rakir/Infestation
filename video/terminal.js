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
  constructor() {
    const drawer = new CanvasDrawer("terminal");

    frequencyInput = new Input("frequency");
    frequencyInput.onChange = this.frequencyChanged.bind(this);
    amplitudeInput = new Input("amplitude");
    amplitudeInput.onChange = this.amplitudeChanged.bind(this);
    offsetInput = new Input("offset");
    offsetInput.onChange = this.offsetChanged.bind(this);

    this.initializeSines();

    const renderer = new Renderer(drawer);

    renderer.addEntity(new GridEntity(drawer, this.checkSine));

    renderer.addEntity(new SineEntity(drawer, this.currentSine, new Color(255, 0, 0)));
    renderer.addEntity(new SineEntity(drawer, this.checkSine, new Color(0, 255, 0, 0.3)));

    window.requestAnimationFrame(renderer.draw);
  }

  initializeSines() {
    this.currentSine = new Sine(
      (amplitudeInput.max + amplitudeInput.min) / 2, 
      (frequencyInput.max + frequencyInput.min) / 2, 
      (offsetInput.max + offsetInput.min) / 2
    );

    amplitudeInput.value = this.currentSine.amplitude;
    frequencyInput.value = this.currentSine.frequencyMultiplier;
    offsetInput.value = this.currentSine.offset;

    const randomAmplitude = random(amplitudeInput.min, amplitudeInput.max, amplitudeInput.step);
    const randomFrequency = random(frequencyInput.min, frequencyInput.max, frequencyInput.step);
    const randomOffset = random(offsetInput.min, offsetInput.max, offsetInput.step);

    this.checkSine = new Sine(randomAmplitude, randomFrequency, randomOffset);
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
      alert("Winner is you!");
    }
  }
}

function random(min, max, step) {
  return min + (step * Math.floor(Math.random() * (max - min + 1) / step));
}