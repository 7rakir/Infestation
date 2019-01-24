class CameraScreen {
  constructor(onSectorClear, onGameOver, onSquadLeave, onSquadArrive) {
    this.onSectorClear = onSectorClear;
    this.onGameOver = onGameOver;
    this.onSquadLeave = onSquadLeave;
    this.onSquadArrive = onSquadArrive;

    this.drawer = new CanvasDrawer("camera");
    this.battlefield = new Battlefield(this.onMarineDeath.bind(this), this.onAlienDeath.bind(this), this.onBattleEnd.bind(this));
    this.controls = new SquadControls(this.battlefield, this.squadLeave.bind(this));

    this.renderer = new Renderer(this.drawer);

    this.walls = new WallsEntity(this.drawer);
    this.renderer.addEntity(this.walls);

    this.battlefield.squad.marines.forEach(marine => {
      this.renderer.addEntity(new MarineEntity(this.drawer, marine));
    });

    this.currentAlienEntities = [];

    const killButton = new Input("kill");
    killButton.onClick = () => this.battlefield.killCurrentAliens();

    window.requestAnimationFrame(this.renderer.draw);
  }

  squadLeave(dx, dy) {
    console.log("leaving " + this.battlefield.currentTile.x + "," + this.battlefield.currentTile.y);
    this.controls.lockMoving();
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
    this.battlefield.doBattle();
    this.onSquadArrive();
  }

  onMarineDeath(marine) {
    this.renderer.removeEntityWhere(marineEntity => marineEntity.marine == marine);
  }

  onAlienDeath(alien) {
    this.renderer.removeEntityWhere(alienEntity => alienEntity.alien == alien);
  }

  onBattleEnd(sectorClear) {
    if(sectorClear) {
      this.onSectorClear();
    }
    else {
      this.onGameOver();
    }
  }
}

class SquadControls {
  constructor(battlefield, onSquadLeave) {
    this.battlefield = battlefield;
    this.onSquadLeave = onSquadLeave;
    this.movingLocked = false;
    topInput = this.registerDirectionInput("top", this.moveSquad.bind(this), 0, -1);
    leftInput = this.registerDirectionInput("left", this.moveSquad.bind(this), -1, 0);
    rightInput = this.registerDirectionInput("right", this.moveSquad.bind(this), 1, 0);
    bottomInput = this.registerDirectionInput("bottom", this.moveSquad.bind(this), 0, 1);
    this.updateAvailability();
  }

  moveSquad(dx, dy) {
    this.onSquadLeave(dx, dy);
    this.updateAvailability();
  }

  lockMoving() {
    this.movingLocked = true;
    this.updateAvailability();
  }

  unlockMoving() {
    this.movingLocked = false;
    this.updateAvailability();
  }

  updateAvailability() {
    topInput.disabled = this.movingLocked || this.battlefield.getAdjacentTile(topInput.dx, topInput.dy) === null;
    leftInput.disabled = this.movingLocked || this.battlefield.getAdjacentTile(leftInput.dx, leftInput.dy) === null;
    rightInput.disabled = this.movingLocked || this.battlefield.getAdjacentTile(rightInput.dx, rightInput.dy) === null;
    bottomInput.disabled = this.movingLocked || this.battlefield.getAdjacentTile(bottomInput.dx, bottomInput.dy) === null;
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
  constructor(onMarineDeath, onAlienDeath, onBattleEnd) {
    this.onMarineDeath = onMarineDeath;
    this.onAlienDeath = onAlienDeath;
    this.onBattleEnd = onBattleEnd;

    this.grid = new Grid(5);
    this.squad = new Squad(this.grid.getTile(0, 0), 4);

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

  leaveBattle(sectorClear) {
    this.squadAttacking && clearInterval(this.squadAttacking);
    this.aliensAttacking && clearInterval(this.aliensAttacking);
    this.onBattleEnd(sectorClear);
  }

  squadAttacks() {
    this.squad.marines.forEach(marine => {
      const closestAlien = this.getClosestAlien();
      if (closestAlien) {
        this.resolveMarineAttack(marine, closestAlien);
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
      const closestMarine = this.getClosestMarine();
      if (closestMarine) {
        this.resolveAlienAttack(alien, closestMarine);
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
      this.onMarineDeath(marine);
      this.squad.removeMarine(marine);
      console.log("alien killed marine");
    }
  }

  getClosestAlien() {
    return this.currentTile.aliens[0];
  }

  getClosestMarine() {
    return this.squad.marines[0];
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

    this.aliens = [];
    for (var i = 0; i < alienCount; i++) {
      this.aliens.push(new Unit(2, 1, i));
    }
  }

  removeAlien(removedAlien) {
    this.aliens = this.aliens.filter(function (alien) {
      return alien !== removedAlien;
    });
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
