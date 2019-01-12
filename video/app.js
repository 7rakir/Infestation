class Game {
  constructor() {
    const click = () => {
      window.removeEventListener('click', click);
      document.getElementById('start').remove();
      this.start();
    };
    window.addEventListener('click', click);
  }

  start() {
    this.audio = createAudio();
    this.camera = new CameraScreen(this.onSectorClear.bind(this), this.onGameOver.bind(this), this.onSquadArrive.bind(this));
    this.terminal = new Terminal(this.onSync.bind(this), this.audio);
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
  constructor(onStop) {
    this.moving = false;
    this.current = 0;
    this.onStop = onStop;
  }

  startMoving() {
    this.moving = true;
  }

  stop() {
    this.moving = false;
    this.current = 0;
    this.onStop && this.onStop();
  }
}

class LengthAnimation extends Animation {
  constructor(finalLength, speed, onStop) {
    super(onStop);
    this.speed = speed;
    this.finalLength = finalLength;
    this.dx = 0;
    this.dy = 0;
  }

  start(dx, dy) {
    this.startMoving();
    this.dx = dx;
    this.dy = dy;
  }

  update(timeSinceLastFrame) {
    var increment = this.speed * timeSinceLastFrame;

    this.current += increment;

    const overshoot = this.finalLength - this.current;
    if (overshoot < 0) {
      increment += overshoot;
      this.stop();
    }

    return {
      x: increment * this.dx,
      y: increment * this.dy
    };
  }
}

class DurationAnimation extends Animation {
  constructor(finalDuration, onExpire) {
    super(onExpire);
    this.finalDuration = finalDuration;
  }

  get progress() {
    return this.progressFunction(this.current / this.finalDuration);
  }

  progressFunction(timeFraction) {
    return Math.pow(timeFraction, 30)
  }

  start() {
    this.startMoving();
  }

  update(timeSinceLastFrame) {
    var increment = timeSinceLastFrame;

    this.current += increment;

    const overshoot = this.finalDuration - this.current;
    if (overshoot < 0) {
      increment += overshoot;
      this.stop();
    }
  }
}
