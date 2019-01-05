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

var drawer;

var previousTimestamp;
const entities = [];
function draw(timestamp) {
  drawer.clear();

  const progress = timestamp - previousTimestamp || 0;
  previousTimestamp = timestamp;
  
  entities.forEach(entity => {
    entity.draw();
    entity.update(progress);
  });

  window.requestAnimationFrame(draw);
}

class Terminal {
  constructor() {
    drawer = new CanvasDrawer("terminal");

    frequencyInput = registerInput("frequency", this.frequencyChanged.bind(this));
    amplitudeInput = registerInput("amplitude", this.amplitudeChanged.bind(this));
    offsetInput = registerInput("offset", this.offsetChanged.bind(this));

    this.initializeSines();

    entities.push(new GridEntity(this.checkSine));

    entities.push(new SineEntity(this.currentSine, new Color(255, 0, 0)));
    entities.push(new SineEntity(this.checkSine, new Color(0, 255, 0, 0.3)));

    window.requestAnimationFrame(draw);
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