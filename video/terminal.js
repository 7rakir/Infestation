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

var currentSine = new Sine(50, 100, 0);

const randomAmplitude = random(25, 100, 5);
const randomFrequency = random(50, 200, 10);
const randomOffset = random(-10, 10, 1);
var checkSine = new Sine(randomAmplitude, randomFrequency, randomOffset);

const entities = [];

function draw() {
  drawer.clear();

  entities.forEach(entity => {
    entity.draw();
    entity.tick();
  });

  window.requestAnimationFrame(draw);
}

class Terminal {
  constructor() {
    drawer = new CanvasDrawer("terminal");

    frequencyInput = registerInput("frequency", currentSine.frequencyMultiplier, frequencyChanged);
    amplitudeInput = registerInput("amplitude", currentSine.amplitude, amplitudeChanged);
    offsetInput = registerInput("offset", currentSine.offset, offsetChanged);

    entities.push(new GridEntity(checkSine));

    entities.push(new SineEntity(currentSine, new Color(255, 0, 0)));
    entities.push(new SineEntity(checkSine, new Color(0, 255, 0, 0.3)));

    window.requestAnimationFrame(draw);
  }
}

function frequencyChanged() {
  currentSine.frequencyMultiplier = parseInt(frequencyInput.value);
  checkSynchronization(currentSine, checkSine);
}

function amplitudeChanged() {
  currentSine.amplitude = parseInt(amplitudeInput.value);
  checkSynchronization(currentSine, checkSine);
}

function offsetChanged() {
  currentSine.offsetX = parseInt(offsetInput.value);
  checkSynchronization(currentSine, checkSine);
}

function checkSynchronization(currentSine, checkSine) {
  const frequenciesEqual = currentSine.frequencyMultiplier == checkSine.frequencyMultiplier;
  const amplitudesEqual = currentSine.amplitude == checkSine.amplitude;

  const offsetDifference = currentSine.offsetX - checkSine.offsetX;
  const offsetInSync = Math.abs(offsetDifference) == 10 || offsetDifference == 0;

  if (frequenciesEqual && amplitudesEqual && offsetInSync) {
    alert("Winner is you!");
  }
}

function random(min, max, step) {
  return min + (step * Math.floor(Math.random() * (max - min + 1) / step));
}