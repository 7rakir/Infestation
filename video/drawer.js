class CanvasDrawer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.context = this.canvas.getContext("2d");
    this.yOffset = this.canvas.height / 2;
  }

  drawSineTail(sine, headX, color) {
    var period = sine.period();

    var x = sine.offset() - 7 * period / 4;
    var y = this.yOffset;

    this.context.lineWidth = 3;
    this.context.strokeStyle = this.getBezierGradient(headX, color);

    while (x < this.canvas.width) {
      this.drawBezier(x, y - sine.amplitude, x + period / 2, y + sine.amplitude);
      this.drawBezier(x + period / 2, y + sine.amplitude, x + period, y - sine.amplitude);
      x += period;
    }
  }

  drawSine(sine) {
    this.context.strokeStyle = "rgba(0, 0, 0, 0.2)";

    this.context.beginPath();

    for (var x = 0; x <= this.canvas.width; x += 1) {
      var y = this.yOffset - sine.y(x);
      this.context.lineTo(x, y);
    }

    this.context.stroke();
  }

  getBezierGradient(headX, color) {
    const tailRatio = 0.5;
    const transparent = "rgba(0, 0, 0, 0)";
    const progress = headX / this.canvas.width;
    var gradient = this.context.createLinearGradient(0, 0, this.canvas.width, 0);

    const lowest = Math.max(0, progress - tailRatio);
    gradient.addColorStop(lowest, transparent);

    gradient.addColorStop(progress, color.full());
    gradient.addColorStop(progress, transparent);

    if (progress < tailRatio) {
      gradient.addColorStop(1 - (tailRatio - progress), transparent);
      const transparency = (tailRatio - progress) / tailRatio * color.alpha;
      gradient.addColorStop(1, new Color(color.red, color.green, color.blue, transparency).full());
    }

    gradient.addColorStop(1, transparent);

    return gradient;
  }

  drawBezier(x1, y1, x2, y2) {
    this.context.beginPath();

    var dx = x2 - x1;
    var K = 0.36421;

    this.context.moveTo(x1, y1);
    this.context.bezierCurveTo(x1 + K * dx, y1, x2 - K * dx, y2, x2, y2);

    this.context.stroke();
  }

  drawSineHead(sine, x, color) {
    this.context.beginPath();
    this.context.strokeStyle = color.full();
    this.context.arc(x, this.yOffset - sine.y(x), 1, 0, 2 * Math.PI);
    this.context.fillStyle = color.full();
    this.context.fill();
    this.context.stroke();
  }

  drawHorizontalGrid(step) {
    this.context.lineWidth = 1;

    var y = step;
    while (y < this.canvas.height) {
      this.drawLine(0, y, this.canvas.width, y, "rgba(50, 50, 50, 0.5)");
      y += step;
    }
    this.context.stroke();
  }

  drawVerticalGrid(step) {
    this.context.lineWidth = 1;

    var x = step;
    while (x < this.canvas.width) {
      this.drawLine(x, 0, x, this.canvas.height, "rgba(50, 50, 50, 0.5)");
      x += step;
    }
    this.context.stroke();
  }

  drawLine(x1, y1, x2, y2, color) {
    this.context.strokeStyle = color;
    this.context.moveTo(x1, y1);
    this.context.lineTo(x2, y2);
  }

  clear() {
    this.context.fillStyle = "black";
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
}