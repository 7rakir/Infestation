var battlefield;

var topInput;
var leftInput;
var rightInput;
var bottomInput;

window.onload = function (event) {
  battlefield = new Battlefield();
  topInput = document.getElementById("top");
  leftInput = document.getElementById("left");
  rightInput = document.getElementById("right");
  bottomInput = document.getElementById("bottom");
  topInput.onclick = moveSquadTop;
  leftInput.onclick = moveSquadLeft;
  rightInput.onclick = moveSquadRight;
  bottomInput.onclick = moveSquadBottom;
  updateAvailability();

  new Terminal();
};

function moveSquadTop() {
  const targetTile = battlefield.getAdjacentTile(0, -1);
  battlefield.moveSquad(targetTile);
  updateAvailability();
}

function moveSquadLeft() {
  const targetTile = battlefield.getAdjacentTile(-1, 0);
  battlefield.moveSquad(targetTile);
  updateAvailability();
}

function moveSquadRight() {
  const targetTile = battlefield.getAdjacentTile(1, 0);
  battlefield.moveSquad(targetTile);
  updateAvailability();
}

function moveSquadBottom() {
  const targetTile = battlefield.getAdjacentTile(0, 1);
  battlefield.moveSquad(targetTile);
  updateAvailability();
}

function updateAvailability() {
  topInput.disabled = battlefield.getAdjacentTile(0, -1) === null;
  leftInput.disabled = battlefield.getAdjacentTile(-1, 0) === null;
  rightInput.disabled = battlefield.getAdjacentTile(1, 0) === null;
  bottomInput.disabled = battlefield.getAdjacentTile(0, 1) === null;
}

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
