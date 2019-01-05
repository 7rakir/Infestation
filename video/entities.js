class SineEntity {
  constructor(sine, color) {
    this.sine = sine;
    this.headX = 0;
    this.incrementX = 0.3;
    this.color = color;
  }

  draw() {
    drawer.drawSineTail(this.sine, this.headX, this.color);
    drawer.drawSineHead(this.sine, this.headX, this.color);
  }

  update(timeSinceLastFrame) {
    this.headX = (this.headX + this.incrementX * timeSinceLastFrame) % drawer.canvas.width;
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

  update() { }
}