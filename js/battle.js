class CameraScreen {
  constructor(audio, onGameOver, onSquadLeave, onSquadArrive) {
    this.audio = audio;
    this.onGameOver = onGameOver;
    this.onSquadLeave = onSquadLeave;
    this.onSquadArrive = onSquadArrive;

    const finalTileCoordinates = { x: 4, y: 4};

    this.drawer = new CanvasDrawer("camera");
    this.battlefield = new Battlefield(this.onMarineDeath.bind(this), this.onAlienDeath.bind(this), this.onShot.bind(this), finalTileCoordinates);
    this.controls = new SquadControls(this.battlefield, this.squadLeave.bind(this));

    this.renderer = new Renderer(this.drawer);

    this.walls = new WallsEntity(this.drawer);
    this.renderer.addEntity(this.walls);

    this.battlefield.squad.marines.forEach(marine => {
      this.renderer.addEntity(new MarineEntity(this.drawer, marine));
    });

    this.currentAlienEntities = [];

    this.finalTile = this.battlefield.grid.getTile(finalTileCoordinates.x, finalTileCoordinates.y);

    const killButton = new Input("kill");
    killButton.onClick = () => this.battlefield.killCurrentAliens();
  }

  start() {
    this.squadArrive();
    window.requestAnimationFrame(this.renderer.draw);
  }

  squadLeave(dx, dy) {
    console.log("leaving " + this.battlefield.currentTile.x + "," + this.battlefield.currentTile.y);
    this.controls.teamStartedMoving();
    this.walls.move(-dx, -dy, this.squadArrive.bind(this));
    this.currentAlienEntities.forEach(alienEntity => {
      alienEntity.move(-dx, -dy);
    });
    const targetTile = this.battlefield.getAdjacentTile(dx, dy);
    this.battlefield.moveSquad(targetTile);
    this.onSquadLeave();
  }

  squadArrive() {
    this.currentAlienEntities.forEach(alienEntity => {
      this.renderer.removeEntity(alienEntity);
    });
    const currentTile = this.battlefield.currentTile;
    this.currentAlienEntities = currentTile.aliens.map(alien => new AlienEntity(this.drawer, alien));
    this.currentAlienEntities.forEach(alienEntity => this.renderer.addEntity(alienEntity));

    console.log("entering " + currentTile.x + "," + currentTile.y);
    if(this.finalTile === currentTile) {
      this.onGameOver(true);
    }
    else {
      this.battlefield.doBattle();
      this.controls.teamFinishedMoving();
      this.onSquadArrive();
    }
  }

  onMarineDeath(marine) {
    this.renderer.removeEntityWhere(marineEntity => marineEntity.unit == marine);
    if(this.battlefield.squad.marines.length === 0) {
      this.onGameOver(false);
    }
  }

  onAlienDeath(alien) {
    this.renderer.removeEntityWhere(alienEntity => alienEntity.unit == alien);
  }

  onShot(source, target) {
    const sourceEntity = this.renderer.entities.find(entity => entity.unit === source);
    const targetEntity = this.renderer.entities.find(entity => entity.unit === target);
    const shotEntity = new ShotEntity(this.drawer, sourceEntity, targetEntity);
    this.renderer.addEntity(shotEntity);
    shotEntity.start(() => this.onShotFinish(shotEntity, sourceEntity, targetEntity));
    this.audio.fire();
  }

  onShotFinish(shotEntity, sourceEntity, targetEntity) {
    this.renderer.removeEntity(shotEntity);

    if(sourceEntity instanceof AlienEntity) {
      this.battlefield.resolveAlienAttack(sourceEntity.unit, targetEntity.unit);
    }
    else {
      this.battlefield.resolveMarineAttack(sourceEntity.unit, targetEntity.unit);
    }
  }

  disableCamera() {
    topInput.hidden = true;
    leftInput.hidden = true;
    rightInput.hidden = true;
    bottomInput.hidden = true;
    this.renderer.stop();
  }
}

class SquadControls {
  constructor(battlefield, onSquadLeave) {
    this.battlefield = battlefield;
    this.onSquadLeave = onSquadLeave;
    this.movingLocked = true;
    this.teamIsMoving = false;
    topInput = this.registerDirectionInput("top", this.moveSquad.bind(this), 0, -1);
    topInput.hidden = false;
    leftInput = this.registerDirectionInput("left", this.moveSquad.bind(this), -1, 0);
    leftInput.hidden = false;
    rightInput = this.registerDirectionInput("right", this.moveSquad.bind(this), 1, 0);
    rightInput.hidden = false;
    bottomInput = this.registerDirectionInput("bottom", this.moveSquad.bind(this), 0, 1);
    bottomInput.hidden = false;
    this.updateAvailability();
  }

  moveSquad(dx, dy) {
    this.onSquadLeave(dx, dy);
    this.updateAvailability();
  }

  teamStartedMoving() {
    this.teamIsMoving = true;
    this.updateAvailability();
  }

  teamFinishedMoving() {
    this.teamIsMoving = false;
    this.updateAvailability();
  }

  unlockCurrentTile() {
    this.battlefield.currentTile.unlock();
    this.updateAvailability();
  }

  updateAvailability() {
    this.updateInputAvailability(topInput);
    this.updateInputAvailability(leftInput);
    this.updateInputAvailability(rightInput);
    this.updateInputAvailability(bottomInput);
  }

  updateInputAvailability(input) {
    const targetTile = this.battlefield.getAdjacentTile(input.dx, input.dy);
    const isTargetPossible = targetTile !== null;
    const isTargetAlreadyUnlocked = isTargetPossible && targetTile.unlocked;
    const isCurrentTileUnlocked = this.battlefield.currentTile.unlocked;

    const enabled = !this.teamIsMoving && isTargetPossible && (isTargetAlreadyUnlocked || isCurrentTileUnlocked);

    input.disabled = !enabled;
  }

  registerDirectionInput(id, onClick, dx, dy) {
    const input = new Input(id);
    input.onClick = function () {
      onClick(dx, dy);
    };
    input.dx = dx;
    input.dy = dy;
    return input;
  }
}

class Battlefield {
  constructor(onMarineDeath, onAlienDeath, onShot, finalTileCoordinates) {
    this.onMarineDeath = onMarineDeath;
    this.onAlienDeath = onAlienDeath;
    this.onShot = onShot;

    this.grid = new Grid(5);

    const startingTile = this.grid.getTile(0, 0);
    this.grid.clearTile(startingTile);
    const finalTile = this.grid.getTile(finalTileCoordinates.x, finalTileCoordinates.y);
    this.grid.clearTile(finalTile);

    this.squad = new Squad(startingTile, 4);

    this.squadAttacks = this.squadAttacks.bind(this);
    this.aliensAttack = this.aliensAttack.bind(this);
  }

  get currentTile() {
    return this.squad.tile;
  }

  moveSquad(tile) {
    this.leaveBattle();
    this.squad.changeTile(tile);
  }

  doBattle() {
    this.squadAttacking = setInterval(this.squadAttacks, 3000);
    this.aliensAttacking = setInterval(this.aliensAttack, 2000);
  }

  leaveBattle() {
    this.squadAttacking && clearInterval(this.squadAttacking);
    this.aliensAttacking && clearInterval(this.aliensAttacking);
  }

  squadAttacks() {
    this.squad.marines.forEach(marine => {
      const closestAlien = this.getClosestAlien(marine);
      if (closestAlien) {
        this.onShot(marine, closestAlien);
      }
      else {
        this.leaveBattle(true);
        console.log("sector clear");
        return;
      }
    });
  }

  aliensAttack() {
    this.currentTile.aliens.forEach(alien => {
      const closestMarine = this.getClosestMarine(alien);
      if (closestMarine) {
        this.onShot(alien, closestMarine);
      }
      else {
        this.leaveBattle(false);
        console.log("squad killed");
        return;
      }
    });
  }

  resolveMarineAttack(marine, alien) {
    console.log("marine attacking alien:" + alien.hitpoints + "-" + marine.power);

    const targetDied = marine.attack(alien);

    if (targetDied) {
      this.onAlienDeath(alien);
      this.currentTile.removeAlien(alien);
      console.log("marine killed alien");
    }
  }

  resolveAlienAttack(alien, marine) {
    console.log("alien attacking marine:" + marine.hitpoints + "-" + alien.power);

    const targetDied = alien.attack(marine);

    if (targetDied) {
      this.squad.removeMarine(marine);
      this.onMarineDeath(marine);
      console.log("alien killed marine");
    }
  }

  getClosestAlien(marine) {
    return this.getClosestIndex(marine, this.currentTile.aliens);
  }

  getClosestMarine(alien) {
    return this.getClosestIndex(alien, this.squad.marines);
  }

  getClosestIndex(unit, enemies) {
    const positionDifferences = enemies.map(enemy => Math.abs(unit.position - enemy.position));
    var index = positionDifferences.findIndex(difference => difference === 0);
    if(index === -1) {
      var index = positionDifferences.findIndex(difference => difference === 1 || difference === 3);
    }
    if(index === -1) {
      var index = positionDifferences.findIndex(difference => difference === 2);
    }
    return enemies[index];
  }

  isAllowed(x, y) {
    return x >= 0 && y >= 0 && x < this.grid.size && y < this.grid.size;
  }

  getAdjacentTile(dx, dy) {
    const newX = this.currentTile.x + dx;
    const newY = this.currentTile.y + dy;

    if (this.isAllowed(newX, newY)) {
      return this.grid.getTile(newX, newY);
    }
    return null;
  }

  killCurrentAliens() {
    this.currentTile.aliens.forEach(alien => {
      this.onAlienDeath(alien);
      this.currentTile.removeAlien(alien);
    })
  }
}

class Tile {
  constructor(x, y, alienCount) {
    this.x = x;
    this.y = y;
    this.unlocked = false;

    this.aliens = [];
    this.addAliens(alienCount);
  }

  addAliens(alienCount) {
    const possiblePositions = [0, 1, 2, 3];
    for(var i = 0; i < alienCount; i++) {
      const randomIndex = random(0, possiblePositions.length - 1);
      const position = possiblePositions[randomIndex];
      possiblePositions.splice(randomIndex, 1);
      this.aliens.push(new Unit(2, 1, position));
    }
  }

  removeAlien(removedAlien) {
    this.aliens = this.aliens.filter(function (alien) {
      return alien !== removedAlien;
    });
  }

  unlock() {
    this.unlocked = true;
  }
}

class Grid {
  constructor(size) {
    this.size = size;

    this.tiles = new Array(size);
    for (var i = 0; i < this.tiles.length; i++) {
      this.tiles[i] = new Array(size);
      for (var j = 0; j < this.tiles[i].length; j++) {
        const alienCount = random(1, 4);
        this.tiles[i][j] = new Tile(j, i, alienCount);
      }
    }
  }

  getTile(x, y) {
    return this.tiles[y][x];
  }

  clearTile(tile) {
    tile.aliens = [];
  }
}

class Squad {
  constructor(tile, squadSize) {
    this.tile = tile;

    this.marines = [];
    for (var i = 0; i < squadSize; i++) {
      this.marines.push(new Unit(10, 1, i));
    }
  }

  changeTile(tile) {
    this.tile = tile;
  }

  removeMarine(removedMarine) {
    this.marines = this.marines.filter(function (marine) {
      return marine !== removedMarine;
    });
  }
}

class Unit {
  constructor(hitpoints, power, position) {
    this.hitpoints = hitpoints;
    this.power = power;
    this.position = position;
  }

  attack(unit) {
    unit.hitpoints -= this.power;
    return unit.hitpoints <= 0;
  }
}
