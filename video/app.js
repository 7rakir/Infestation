var drawer;

window.onload = function (event) {
    drawer = new CanvasDrawer("terminal");

    window.requestAnimationFrame(draw);
};

class Sine {
    constructor(amplitude, frequency) {
        this.amplitude = amplitude;
        this.frequency = frequency;
    }

    y(x) {
        return this.amplitude * Math.sin(x / this.frequency);
    }
}

class CanvasDrawer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.context = this.canvas.getContext("2d");
        this.yOffset = this.canvas.height / 2;
    }

    drawSineLine(sine, leadX) {
        this.context.beginPath();

        for(var x = leadX - 50; x <= leadX; x += 1) {
            var y = this.yOffset + sine.y(x);
            this.context.lineTo(x, y);
        }

        this.context.stroke();
    }

    drawSineLead(sine, x) {
        this.context.beginPath();
        this.context.arc(x, this.yOffset + sine.y(x), 5, 0, 2 * Math.PI);
        this.context.stroke();
    }

    clear() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}

var x = 50;
var y = 150;
const incrementX = 3;
const incrementY = 0;

function draw() {
    drawer.clear();

    x = (x + incrementX) % terminal.width;

    const amplitude = 70;
    const frequency = 20;

    const sine = new Sine(amplitude, frequency);

    drawer.drawSineLine(sine, x);
    drawer.drawSineLead(sine, x);

    window.requestAnimationFrame(draw);
}
