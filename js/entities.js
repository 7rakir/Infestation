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
    const duration = 500;
    this.pulsing = new DurationAnimation(duration, null, pulseProgressFunction, duration/2);
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
  constructor(drawer, marine, name) {
    this.drawer = drawer;
    this.unit = marine;
    this.name = name.toUpperCase();
    this.spacing = 70;
    this.originX = drawer.canvas.width / 2;
    this.originY = drawer.canvas.height / 2;

    this.color = new Color(20, 145, 26);
    this.shotColor = new Color(50, 255, 50);

    const position = getUnitPosition(this.unit.position, this.spacing);
    this.x = this.originX + position.x;
    this.y = this.originY + position.y;
  }

  draw() {
    this.drawer.drawCircle(this.x, this.y, this.color);
    const text = this.name + " " + this.unit.hitpoints;
    this.drawer.writeText(this.x, this.y - 22, text, this.color);
  }

  update() { }
}

class AlienEntity {
  constructor(drawer, alien) {
    this.drawer = drawer;
    this.unit = alien;
    this.spacing = 160;
    this.originX = drawer.canvas.width / 2;
    this.originY = drawer.canvas.height / 2;

    this.color = new Color(170, 0, 0);
    this.shotColor = new Color(255, 50, 50);

    const position = getUnitPosition(this.unit.position, this.spacing);
    this.x = this.originX + position.x;
    this.y = this.originY + position.y;
  }

  draw() {
    this.drawer.drawCircle(this.x, this.y, this.color);
    const text = "ALIEN " + this.unit.hitpoints + "";
    this.drawer.writeText(this.x, this.y - 22, text, this.color);
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
    wall.x = negativeModulo(wall.x + increment.x, screen);
    wall.y = negativeModulo(wall.y + increment.y, screen);
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

class ShotEntity {
  constructor(drawer, sourceEntity, targetEntity) {
    this.drawer = drawer;
    this.sourceEntity = sourceEntity;
    this.targetEntity = targetEntity;
  }

  draw() {
    this.drawer.drawShot(this.sourceEntity.x, this.sourceEntity.y, this.targetEntity.x, this.targetEntity.y, this.sourceEntity.shotColor, this.animation.progress);
  }

  update(timeSinceLastFrame) {
    this.animation.update(timeSinceLastFrame);
  }

  start(onExpire) {
    const duration = 200;
    this.animation = new DurationAnimation(duration, onExpire, linearProgressFunction);
    this.animation.startMoving();
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
