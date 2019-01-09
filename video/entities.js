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

class WallsEntity {
  constructor(drawer) {
    this.drawer = drawer;
    this.spacing = 100;

    this.horizontalWalls = [];
    this.verticalWalls = [];
    this.verticalWalls.push(getWall(this.drawer, false, false, this.spacing));
    this.horizontalWalls.push(getWall(this.drawer, false, true, this.spacing));
    this.verticalWalls.push(getWall(this.drawer, true, false, this.spacing));
    this.horizontalWalls.push(getWall(this.drawer, true, true, this.spacing));
    
    this.color = new Color(80, 80, 80);
    this.increment = 0.5;

    this.moving = false;
    this.dx = 0;
    this.dy = 0;
    this.currentMoveLength = 0;
  }

  draw() {
    this.drawer.context.beginPath();
    this.horizontalWalls.forEach(wall => wall.lineDrawer(wall.position, this.color));
    this.verticalWalls.forEach(wall => wall.lineDrawer(wall.position, this.color));
    this.drawer.context.stroke();
  }

  update(timeSinceLastFrame) {
    var increment = 0;
    if(this.moving) {
      increment = this.increment * timeSinceLastFrame;
      this.currentMoveLength += increment;
      const checkWall = this.dx !== 0 ? this.verticalWalls[0] : this.horizontalWalls[0];
      if(this.currentMoveLength >= checkWall.max - 2 * this.spacing) {
        increment += (checkWall.max - 2 * this.spacing) - this.currentMoveLength;
        this.stop();
      }
    }
    this.horizontalWalls.forEach(wall => this.updateWall(wall, increment, this.dy));
    this.verticalWalls.forEach(wall => this.updateWall(wall, increment, this.dx));
  }

  move(dx, dy) {
    this.moving = true;
    this.dx = dx;
    this.dy = dy;
  }

  stop() {
    this.moving = false;
    this.currentMoveLength = 0;
  }

  updateWall(wall, increment, change) {
    const screen = 2 * wall.max - 4 * this.spacing;
    wall.position = (((wall.position + change * increment) % screen) + screen) % screen;
  }
}

function getWall(drawer, start, horizontal, spacing) {
  const wall = {};
  if(horizontal) {
    wall.max = drawer.canvas.height;
    wall.lineDrawer = drawer.drawHorizontalLine.bind(drawer);
  }
  else {
    wall.max = drawer.canvas.width;
    wall.lineDrawer = drawer.drawVerticalLine.bind(drawer);
  }
  wall.position = start ? spacing : wall.max - spacing;
  wall.offset = 0;
  return wall;
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
