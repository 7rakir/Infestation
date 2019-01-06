class Battlefield {
  constructor() {
    this.grid = new Grid(5);
    this.squad = new Squad(this.grid.getTile(0, 0), 3);

    this.squadAttacks = this.squadAttacks.bind(this);
    this.aliensAttack = this.aliensAttack.bind(this);
  }

  get currentTile() {
    return this.squad.tile;
  }

  moveSquad(tile) {
    this.leaveBattle();
    this.squad.changeTile(tile);
    console.log("» " + this.currentTile.x + "," + this.currentTile.y);
    this.doBattle();
  }

  doBattle() {
    this.squadAttacking = setInterval(this.squadAttacks, 1000);
    this.aliensAttacking = setInterval(this.aliensAttack, 750);
  }

  leaveBattle() {
    this.squadAttacking && clearInterval(this.squadAttacking);
    this.aliensAttacking && clearInterval(this.aliensAttacking);
  }

  squadAttacks() {
    this.squad.marines.forEach(marine => {
      const closestAlien = this.getClosestAlien();
      if (closestAlien) {
        this.resolveMarineAttack(marine, closestAlien);
      }
    });
  }

  aliensAttack() {
    this.currentTile.aliens.forEach(alien => {
      const closestMarine = this.getClosestMarine();
      if (closestMarine) {
        this.resolveAlienAttack(alien, closestMarine);
      }
    });
  }

  resolveMarineAttack(marine, alien) {
    console.log("marine attacking alien:" + alien.hitpoints + "-" + marine.power);
    const targetDied = marine.attack(alien);

    if (targetDied) {
      this.currentTile.removeAlien(alien);
      console.log("marine killed alien");
    }
  }

  resolveAlienAttack(alien, marine) {
    console.log("alien attacking marine:" + marine.hitpoints + "-" + alien.power);
    const targetDied = alien.attack(marine);
    
    if (targetDied) {
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
}

class Tile {
  constructor(x, y, alienCount) {
    this.x = x;
    this.y = y;

    this.aliens = [];
    for (var i = 0; i < alienCount; i++) {
      this.aliens.push(new Unit(2, 1));
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
        this.tiles[i][j] = new Tile(j, i, 1);
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
      this.marines.push(new Unit(10, 1));
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
  constructor(hitpoints, power) {
    this.hitpoints = hitpoints;
    this.power = power;
  }

  attack(unit) {
    unit.hitpoints -= this.power;
    return unit.hitpoints <= 0;
  }
}
