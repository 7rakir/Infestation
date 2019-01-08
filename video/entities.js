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

class MarineEntity {
  constructor(drawer, marine) {
    this.drawer = drawer;
    this.marine = marine;
    this.spacing = 40;
    this.originX = drawer.canvas.width / 2;
    this.originY = drawer.canvas.height / 2;
    
    const position = getUnitPosition(this.marine.position, this.spacing);
    this.x = this.originX + position.x;
    this.y = this.originY + position.y;
  }

  draw() {
    this.drawer.drawMarine(this.x, this.y);
  }

  update() { }
}

class AlienEntity {
  constructor(drawer, alien, direction) {
    this.drawer = drawer;
    this.alien = alien;
    this.spacing = 40;
    this.originX = drawer.canvas.width / 2 - 200;
    this.originY = drawer.canvas.height / 2;

    const position = getUnitPosition(this.alien.position, this.spacing);
    this.x = this.originX + position.x;
    this.y = this.originY + position.y;
  }

  draw() {
    this.drawer.drawAlien(this.x, this.y);
  }

  update() { }
}

function getUnitPosition(position, spacing) {
  const direction = {};
  const moduloX = position % 2;
  const divideX = Math.floor(position / 2);
  const offsetX = moduloX * spacing * (1 - 2 * divideX);
  direction.x = offsetX;

  const offsetY = offsetX + (2 * divideX - 1) * spacing;
  direction.y = offsetY;
  return direction;
}