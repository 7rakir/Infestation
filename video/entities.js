class SineEntity {
  constructor(drawer, sine, color) {
    this.drawer = drawer;
    this.sine = sine;
    this.headX = 0;
    this.incrementX = 0.1;
    this.color = color;
  }

  draw() {
    this.drawer.drawSineTail(this.sine, this.headX, this.color);
    this.drawer.drawSineHead(this.sine, this.headX, this.color, this.pulsing && this.pulsing.moving && this.pulsing.progress);
  }

  update(timeSinceLastFrame) {
    this.headX = (this.headX + this.incrementX * timeSinceLastFrame) % this.drawer.canvas.width;
    this.pulsing && this.pulsing.update(timeSinceLastFrame);
  }

  startPulse() {
    this.pulsing = new DurationAnimation(500, 500/2);
    this.pulsing.startMoving();
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
  constructor(drawer, alien) {
    this.drawer = drawer;
    this.alien = alien;
    this.spacing = 100;
    this.originX = drawer.canvas.width / 2;
    this.originY = drawer.canvas.height / 2;

    const position = getUnitPosition(this.alien.position, this.spacing);
    this.x = this.originX + position.x;
    this.y = this.originY + position.y;
  }

  draw() {
    this.drawer.drawAlien(this.x, this.y);
  }

  update(timeSinceLastFrame) {
    if(this.animation && this.animation.moving) {
      var increment = this.animation.update(timeSinceLastFrame);
      this.x = (this.x + increment.x);
      this.y = (this.y + increment.y);
    }
  }

  move(dx, dy) {
    const directionMax = dx !== 0 ? this.drawer.canvas.width : this.drawer.canvas.height;
    this.animation = new LengthAnimation(directionMax, 0.5);
    this.animation.start(dx, dy);
  }
}

class WallsEntity {
  constructor(drawer) {
    this.drawer = drawer;
    this.spacing = 50;

    this.walls = [];
    this.walls.push(this.getWall(false, false));
    this.walls.push(this.getWall(false, true));
    this.walls.push(this.getWall(true, false));
    this.walls.push(this.getWall(true, true));

    this.color = new Color(80, 80, 80);
  }

  draw() {
    this.drawer.context.beginPath();
    this.walls.forEach(wall => wall.lineDrawer(wall));
    this.drawer.context.stroke();
  }

  update(timeSinceLastFrame) {
    if(this.animation && this.animation.moving) {
      var increment = this.animation.update(timeSinceLastFrame);
      this.walls.forEach(wall => this.updateWall(wall, increment));
    }
  }

  move(dx, dy, onStop) {
    const directionMax = dx !== 0 ? this.drawer.canvas.width : this.drawer.canvas.height;
    this.animation = new LengthAnimation(directionMax - 2 * this.spacing, 0.5, onStop);
    this.animation.start(dx, dy);
  }

  updateWall(wall, increment) {
    const screen = 2 * wall.max - 4 * this.spacing;
    wall.x = (((wall.x + increment.x) % screen) + screen) % screen;
    wall.y = (((wall.y + increment.y) % screen) + screen) % screen;
  }

  drawHorizontalWall(wall) {
    this.drawer.drawLine(0, wall.y, this.drawer.canvas.width, wall.y, this.color);
  }

  drawVerticalWall(wall) {
    this.drawer.drawLine(wall.x, 0, wall.x, this.drawer.canvas.height, this.color);
  }

  getWall(start, horizontal) {
    const wall = {};
    if(horizontal) {
      wall.max = this.drawer.canvas.height;
      wall.lineDrawer = this.drawHorizontalWall.bind(this);
      wall.x = 0;
      wall.y = start ? this.spacing : wall.max - this.spacing;
    }
    else {
      wall.max = this.drawer.canvas.width;
      wall.lineDrawer = this.drawVerticalWall.bind(this);
      wall.x = start ? this.spacing : wall.max - this.spacing;
      wall.y = 0;
    }
    return wall;
  }
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
