class SineEntity {
  constructor(drawer, sine, color) {
    this.drawer = drawer;
    this.sine = sine;
    this.headX = 0;
    this.incrementX = 0.3;
    this.color = color;
  }

  draw() {
    this.drawer.drawSineTail(this.sine, this.headX, this.color);
    this.drawer.drawSineHead(this.sine, this.headX, this.color);
  }

  update(timeSinceLastFrame) {
    this.headX = (this.headX + this.incrementX * timeSinceLastFrame) % this.drawer.canvas.width;
  }
}

class GridEntity {
  constructor(drawer, checkSine) {
    this.drawer = drawer;
    this.checkSine = checkSine;
  }

  draw() {
    this.drawer.drawHorizontalGrid(50);

    const stepSize = 500 / this.checkSine.frequencyMultiplier * 4 * Math.PI;
    this.drawer.drawVerticalGrid(stepSize);
  }

  update() { }
}