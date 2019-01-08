var frequencyInput;
var amplitudeInput;
var offsetInput;

var topInput;
var leftInput;
var rightInput;
var bottomInput;

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

  change(change) {
    this.element.value = this.value + change * this.step;
    this.element.dispatchEvent(new Event("change"));
  }
}

document.addEventListener("keydown", onKeyDown, false);

function onKeyDown(event) {
  var keyCode = event.keyCode;

  switch (keyCode) {
    case 97:  // num1
      offsetInput.change(-1);
      break;
    case 99:  // num3
      offsetInput.change(+1);;
      break;
    case 100: // num4
      amplitudeInput.change(-1);
      break;
    case 102: // num6
      amplitudeInput.change(+1);
      break;
    case 103: // num7
      frequencyInput.change(-1);
      break;
    case 105: // num9
      frequencyInput.change(+1);
      break;
  }
}
