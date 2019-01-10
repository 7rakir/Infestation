class Game {
  constructor() {
    window.onload = this.start.bind(this);
  }

  start() {
    this.camera = new CameraScreen(this.onSectorClear.bind(this), this.onGameOver.bind(this), this.onSquadArrive.bind(this));
    this.terminal = new Terminal(this.onSync.bind(this));
  }

  onSectorClear() {}

  onSquadArrive() {
    this.terminal.initializeSines();
  }

  onGameOver() {}

  onSync(){
    this.camera.controls.unlockMoving();
  }
}

const game = new Game();

class Renderer {
  constructor(drawer) {
    this.drawer = drawer;
    this.previousTimestamp = 0;
    this.entities = [];
    this.draw = this.draw.bind(this);
  }

  addEntity(entity) {
    this.entities.push(entity);
  }

  removeEntity(removedEntity) {
    this.entities = this.entities.filter(function (entity) {
      return entity !== removedEntity;
    });
  }

  removeEntityWhere(predicate) {
    this.entities = this.entities.filter(function (entity) {
      return !predicate(entity);
    });
  }

  draw(timestamp) {
    this.drawer.clear();

    const progress = timestamp - this.previousTimestamp;
    this.previousTimestamp = timestamp;

    this.entities.forEach(entity => {
      entity.draw();
      entity.update(progress);
    });

    window.requestAnimationFrame(this.draw);
  }
}

class Animation {
  constructor(finalLength, speed, onStop) {
    this.dx = 0;
    this.dy = 0;
    this.moving = false;
    this.currentLength = 0;
    this.finalLength = finalLength;
    this.speed = speed;
    this.onStop = onStop;
  }

  start(dx, dy) {
    this.moving = true;
    this.dx = dx;
    this.dy = dy;
  }

  update(timeSinceLastFrame) {
    var increment = this.speed * timeSinceLastFrame;

    this.currentLength += increment;

    const overshoot = this.finalLength - this.currentLength;
    if (overshoot < 0) {
      increment += overshoot;
      this.stop();
    }

    return {
      x: increment * this.dx,
      y: increment * this.dy
    };
  }

  stop() {
    this.moving = false;
    this.currentMoveLength = 0;
    this.onStop && this.onStop();
  }
}