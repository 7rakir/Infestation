var frequencyInput;
var amplitudeInput;
var offsetInput;

var topInput;
var leftInput;
var rightInput;
var bottomInput;

var cameraText;

class Input {
  constructor(id) {
    this.element = document.getElementById(id);
  }

  get onChange() {
    return this.element.onchange;
  }
  set onChange(onChange) {
    this.element.onchange = onChange;
  }

  get onClick() {
    return this.element.onclick;
  }
  set onClick(onClick) {
    this.element.onclick = onClick;
  }

  get disabled() {
    return this.element.disabled;
  }
  set disabled(disabled) {
    this.element.disabled = disabled;
  }

  get hidden() {
    return this.element.disabled;
  }
  set hidden(hidden) {
    this.element.hidden = hidden;
  }

  get value() {
    return parseInt(this.element.value);
  }
  set value(value) {
    this.element.value = value;
  }

  get min() {
    return parseInt(this.element.min);
  }

  get max() {
    return parseInt(this.element.max);
  }

  get step() {
    return parseInt(this.element.step);
  }

  change(change, overflow = false) {
    var value = this.value + change * this.step;
    if(overflow) {
      value = negativeModulo(value - this.min, this.max - this.min + 1) + this.min;
    }
    this.element.value = value;
    this.element.dispatchEvent(new Event("change"));
  }

  click() {
    this.element.click();
  }
}

document.addEventListener("keydown", onKeyDown, false);

function onKeyDown(event) {
  var keyCode = event.keyCode;

  switch (keyCode) {
    case 97:  // num1
      offsetInput.change(-1, true);
      break;
    case 98:  // num2
      offsetInput.change(+1, true);
      break;
    case 100: // num4
      amplitudeInput.change(-1);
      break;
    case 101: // num5
      amplitudeInput.change(+1);
      break;
    case 103: // num7
      frequencyInput.change(-1);
      break;
    case 104: // num8
      frequencyInput.change(+1);
      break;
    case 65:  // a
      leftInput.click();
      break;
    case 68:  // d
      rightInput.click();
      break;
    case 83:  // s
      bottomInput.click();
      break;
    case 87:  // w
      topInput.click();
      break;
  }
}
