class Game {
  constructor() {
    const startGame = (event) => {
      if(event.keyCode === 	122) {
        return;
      }
      window.removeEventListener('keydown', startGame);
      document.addEventListener("keydown", onKeyDown, false);
      document.addEventListener("keyup", onKeyUp, false);
      cameraText.hide();
      terminalText.hide();
      this.start();
    };
    window.addEventListener('keydown', startGame);
  }

  start() {
    this.audio = createAudio();
    this.terminal = new Terminal(this.onSync.bind(this), this.audio);
    this.camera = new CameraScreen(this.audio, this.onGameOver.bind(this), this.onSquadLeave.bind(this), this.onSquadArrive.bind(this));
    this.camera.start();

    const clearButton = new Input("clear");
    clearButton.onClick = () => this.onSync();
  }

  onSquadLeave() {
    this.terminal.disableTerminal();
    terminalText.hide();
    this.audio.squadLeavingSector();
  }

  onSquadArrive() {
    if(this.camera.battlefield.currentTile.unlocked) {
      terminalText.addText(tileLockedText);
      terminalText.show();
    }
    else {
      terminalText.hide();
      this.terminal.enableControls();
      this.terminal.initializeSines();
    }

    this.audio.squadEnteringSector();
  }

  onGameOver(isPositiveEnding) {
    this.gameOver = true;
    this.terminal.disableTerminal();
    this.camera.disableCamera();
    cameraText.addText(isPositiveEnding ? winningText : losingText);
    cameraText.show();
    this.audio.gameOver(isPositiveEnding);
    document.getElementById('help').style.display = "none";
    console.log("end " + isPositiveEnding);
  }

  onSync() {
    this.terminal.disableControls();
    this.camera.controls.unlockCurrentTile();
    this.audio.unlocked();
  }

  showHelp() {
    if(!this.gameOver && this.terminal && terminalText) {
      this.terminal.disableTerminal();
      terminalText.addText(helpText);
      terminalText.show();
    }
  }

  hideHelp() {
    if(!this.gameOver && this.terminal && terminalText) {
      if(this.camera.battlefield.currentTile.unlocked) {
        terminalText.addText(tileLockedText);
        terminalText.show();
      }
      else {
        terminalText.hide();
        this.terminal.enableTerminal();
      }
    }
  }
}

var game;
window.onload = () => {
  game = new Game();
  cameraText = new TextArea('camera-text');
  terminalText = new TextArea('terminal-text');

  cameraText.addText(introductionText);
  terminalText.addText(helpText);
}

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
  constructor(finalDuration, onExpire, progressFunction, offset = 0) {
    super(onExpire);
    this.finalDuration = finalDuration + offset;

    this.current = offset;
    this.progressFunction = progressFunction;
  }

  get progress() {
    const adjustedCurrent = Math.max(this.current, 0);
    return this.progressFunction(adjustedCurrent / this.finalDuration);
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

function pulseProgressFunction(timeFraction) {
  const adjustment = Math.pow(10, 18);
  const base = Math.pow(timeFraction, 2) - timeFraction;
  const pulse = Math.pow(base, 30);

  return adjustment * pulse;
}

function linearProgressFunction(timeFraction) {
  return timeFraction;
}

function negativeModulo(value, modulo) {
  return ((value % modulo) + modulo) % modulo;
}

function random(min, max, step = 1) {
  return min + (step * Math.floor(Math.random() * (max - min + 1) / step));
}
