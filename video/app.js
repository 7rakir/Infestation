var drawer;

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

var currentSine = new Sine(50, 90, 0);
var checkSine = new Sine(50, 90, 0);

const entities = [];

window.onload = function (event) {
  drawer = new CanvasDrawer("terminal");

  registerInput("frequency", currentSine.frequencyMultiplier, frequencyChanged);
  registerInput("amplitude", currentSine.amplitude, amplitudeChanged);
  registerInput("offset", currentSine.offset, offsetChanged);

  entities.push(new SineEntity(currentSine));

  window.requestAnimationFrame(draw);
};

class CanvasDrawer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.context = this.canvas.getContext("2d");
    this.yOffset = this.canvas.height / 2;
  }

  drawSineTail(sine, headX) {
    var period = sine.period();

    var x = sine.offset() - 7 * period / 4;
    var y = this.yOffset;

    this.context.strokeStyle = this.getBezierGradient(headX, sine.offsetX);

    while (x < this.canvas.width) {
      this.drawBezier(x, y - sine.amplitude, x + period / 2, y + sine.amplitude);
      this.drawBezier(x + period / 2, y + sine.amplitude, x + period, y - sine.amplitude);
      x += period;
    }
  }

  drawSine(sine) {
    this.context.strokeStyle = "rgba(0, 0, 0, 0.2)";

    this.context.beginPath();

    for (var x = 0; x <= this.canvas.width; x += 1) {
      var y = this.yOffset - sine.y(x);
      this.context.lineTo(x, y);
    }

    this.context.stroke();
  }

  getBezierGradient(headX, offsetX) {
    const tailRatio = 0.3;
    const transparent = "rgba(0, 0, 0, 0)";
    const progress = headX / this.canvas.width;
    var gradient = this.context.createLinearGradient(0, 0, this.canvas.width, 0);

    const lowest = Math.max(0, progress - tailRatio);
    gradient.addColorStop(lowest, transparent);

    gradient.addColorStop(progress, "black");
    gradient.addColorStop(progress, transparent);


    if (progress < tailRatio) {
      gradient.addColorStop(1 - (tailRatio - progress), transparent);
      gradient.addColorStop(1, "rgba(0, 0, 0, " + (tailRatio - progress) / tailRatio + ")");
    }

    gradient.addColorStop(1, transparent);

    return gradient;
  }

  drawBezier(x1, y1, x2, y2) {
    this.context.beginPath();

    var dx = x2 - x1;
    var K = 0.36421;

    this.context.moveTo(x1, y1);
    this.context.bezierCurveTo(x1 + K * dx, y1, x2 - K * dx, y2, x2, y2);

    this.context.stroke();
  }

  drawSineHead(sine, x) {
    this.context.beginPath();
    this.context.strokeStyle = "#000000";
    this.context.arc(x, this.yOffset - sine.y(x), 5, 0, 2 * Math.PI);
    this.context.fillStyle = '#FF0000';
    this.context.fill();
    this.context.stroke();
  }

  clear() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
}

class SineEntity {
  constructor(sine) {
    this.sine = sine;
    this.headX = 0;
    this.incrementX = 1;
  }

  draw() {
    drawer.drawSineTail(this.sine, this.headX);
    drawer.drawSineHead(this.sine, this.headX);
  }

  tick() {
    this.headX = (this.headX + this.incrementX) % drawer.canvas.width;
  }
}

function draw() {
  drawer.clear();

  drawer.drawSine(checkSine);

  entities.forEach(entity => {
    entity.draw();
    entity.tick();
  });

  window.requestAnimationFrame(draw);
}

function registerInput(inputId, currentValue, onChange) {
    var input = document.getElementById(inputId);
    input.value = currentValue;
    input.onchange = onChange;
    return input;
}

function frequencyChanged(event) {
  currentSine.frequencyMultiplier = parseInt(event.target.value);
  checkSynchronization(currentSine, checkSine);
}

function amplitudeChanged(event) {
  currentSine.amplitude = parseInt(event.target.value);
  checkSynchronization(currentSine, checkSine);
}

function offsetChanged(event) {
  currentSine.offsetX = parseInt(event.target.value);
  checkSynchronization(currentSine, checkSine);
}

function checkSynchronization(currentSine, checkSine) {
  const frequenciesEqual = currentSine.frequencyMultiplier == checkSine.frequencyMultiplier;
  const amplitudesEqual = currentSine.amplitude == checkSine.amplitude;

  const offsetDifference = currentSine.offsetX - checkSine.offsetX;
  const offsetInSync = Math.abs(offsetDifference) == 10 || offsetDifference == 0;

  if(frequenciesEqual && amplitudesEqual && offsetInSync) {
    alert("Winner is you!");
  }
}