class SineEntity {
  constructor(sine, color) {
    this.sine = sine;
    this.headX = 0;
    this.incrementX = 2;
    this.color = color;
  }

  draw() {
    drawer.drawSineTail(this.sine, this.headX, this.color);
    drawer.drawSineHead(this.sine, this.headX, this.color);
  }

  tick() {
    this.headX = (this.headX + this.incrementX) % drawer.canvas.width;
  }
}

class GridEntity {
  constructor(checkSine) {
    this.checkSine = checkSine;
  }

  draw() {
    drawer.drawHorizontalGrid(50);

    const stepSize = 500 / this.checkSine.frequencyMultiplier * 4 * Math.PI;
    drawer.drawVerticalGrid(stepSize);
  }

  tick() { }
}