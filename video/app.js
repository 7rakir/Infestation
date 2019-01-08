window.onload = function (event) {
  camera = new CameraScreen();

  new Terminal();
};

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
