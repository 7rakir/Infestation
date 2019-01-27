class Game {
  constructor() {
    const click = () => {
      window.removeEventListener('click', click);
      cameraText = document.getElementById('camera-text');
      terminalText = document.getElementById('terminal-text');
      cameraText.style.display = "none";
      terminalText.style.display = "none";
      this.start();
    };
    window.addEventListener('click', click);
  }

  start() {
    this.audio = createAudio();
    this.terminal = new Terminal(this.onSync.bind(this), this.audio);
    this.camera = new CameraScreen(this.onGameOver.bind(this), this.onSquadLeave.bind(this), this.onSquadArrive.bind(this));

    const clearButton = new Input("clear");
    clearButton.onClick = () => this.camera.controls.unlockMoving();
  }

  onSquadLeave() {
    this.terminal.disableTerminal();
    this.audio.squadLeavingSector();
  }

  onSquadArrive() {
    this.terminal.enableControls();
    this.terminal.initializeSines();
    this.audio.squadEnteringSector();
  }

  onGameOver(isPositiveEnding) {
    this.gameOver = true;
    this.terminal.disableTerminal();
    this.camera.disableCamera();
    cameraText.style.display = "block";
    document.getElementById('help').style.display = "none";
    if(isPositiveEnding) {
      cameraText.innerHTML = "<p>Congratulations!</p><p>Your crew have escaped the horrors of the station.</p>";
    }
    else {
      cameraText.innerHTML = "<p>Game over!</p><p>Your crew has been overwhelmed by the organisms at the station.</p>";
    }
    console.log("end " + isPositiveEnding);
  }

  onSync(){
    this.terminal.disableControls();
    this.camera.controls.unlockMoving();
    this.audio.unlocked();
  }

  showHelp() {
    if(!this.gameOver && this.terminal && terminalText) {
      this.terminal.disableTerminal();
      terminalText.style.display = "block";
    }
  }

  hideHelp() {
    if(!this.gameOver && this.terminal && terminalText) {
      terminalText.style.display = "none";
      this.terminal.enableTerminal();
    }
  }
}

const game = new Game();

class Renderer {
  constructor(drawer) {
    this.drawer = drawer;
    this.previousTimestamp = 0;
    this.entities = [];
    this.draw = this.draw.bind(this);
    this.shouldStopDrawing = false;
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

    if(this.shouldStopDrawing) {
      return;
    }

    const progress = timestamp - this.previousTimestamp;
    this.previousTimestamp = timestamp;

    this.entities.forEach(entity => {
      entity.draw();
      entity.update(progress);
    });

    window.requestAnimationFrame(this.draw);
  }

  stop() {
    this.shouldStopDrawing = true;
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
  constructor(finalDuration, offset, onExpire) {
    super(onExpire);
    this.finalDuration = finalDuration + offset;
    this.adjustment = Math.pow(10, 18);
    this.current = offset;
  }

  get progress() {
    const adjustedCurrent = Math.max(this.current, 0);
    return this.progressFunction(adjustedCurrent / this.finalDuration);
  }

  progressFunction(timeFraction) {
    const base = Math.pow(timeFraction, 2) - timeFraction;
    const pulse = Math.pow(base, 30);

    return this.adjustment * pulse;
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

function negativeModulo(value, modulo) {
  return ((value % modulo) + modulo) % modulo;
}

function random(min, max, step = 1) {
  return min + (step * Math.floor(Math.random() * (max - min + 1) / step));
}
