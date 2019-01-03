var drawer;

var currentSine;

const entities = [];

window.onload = function (event) {
  drawer = new CanvasDrawer("terminal");

  var currentFrequency = 20;
  var currentAmplitude = 50;
  var currentOffset = 1;

  registerInput("frequency", currentFrequency, frequencyChanged);
  registerInput("amplitude", currentAmplitude, amplitudeChanged);
  registerInput("offset", currentOffset, offsetChanged);

  currentSine = new Sine(currentAmplitude, currentFrequency, currentOffset);
  entities.push(new SineEntity(currentSine));

  window.requestAnimationFrame(draw);
};

class Sine {
  constructor(amplitude, frequency, offsetX) {
    this.amplitude = amplitude;
    this.frequency = frequency;
    this.offsetX = offsetX;
  }

  y(x) {
    return this.amplitude * Math.sin(x / this.frequency - this.offsetX);
  }
}

class CanvasDrawer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.context = this.canvas.getContext("2d");
    this.yOffset = this.canvas.height / 2;
  }

  drawSineTail(sine, headX) {
    var period = sine.frequency * 2 * Math.PI;

    var x = 0 - 3 * period / 4 + (sine.offsetX * sine.frequency);
    var y = this.yOffset;

    this.context.strokeStyle = this.getBezierGradient(headX);

    while (x < this.canvas.width) {
      this.drawBezier(x, y - sine.amplitude, x + period / 2, y + sine.amplitude, headX);
      this.drawBezier(x + period / 2, y + sine.amplitude, x + period, y - sine.amplitude, headX);
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

  getBezierGradient(headX) {
    const tailRatio = 0.3;
    const progress = headX / this.canvas.width;
    var gradient = this.context.createLinearGradient(0, 0, this.canvas.width, 0);

    const lowest = Math.max(0, progress - tailRatio);
    gradient.addColorStop(lowest, "white");

    gradient.addColorStop(progress, "black");
    gradient.addColorStop(progress, "white");


    if (progress < tailRatio) {
      gradient.addColorStop(1 - (tailRatio - progress), "white");
      gradient.addColorStop(1, "rgba(0, 0, 0, " + (tailRatio - progress) / tailRatio + ")");
    }

    gradient.addColorStop(1, "white");

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

  drawer.drawSine(new Sine(50, 20, 1));

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
  currentSine.frequency = parseInt(event.target.value);
}

function amplitudeChanged(event) {
  currentSine.amplitude = parseInt(event.target.value);
}

function offsetChanged(event) {
  currentSine.offsetX = parseInt(event.target.value);
}
