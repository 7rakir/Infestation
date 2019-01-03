var frequencyInput;
var amplitudeInput;
var offsetInput;

function registerInput(inputId, currentValue, onChange) {
  var input = document.getElementById(inputId);
  input.value = currentValue;
  input.onchange = onChange;
  return input;
}

document.addEventListener("keydown", onKeyDown, false);

function onKeyDown(event) {
  var keyCode = event.keyCode;

  switch (keyCode) {
    case 97:  // num1
      adjustOffset(-1);
      break;
    case 99:  // num3
      adjustOffset(+1);
      break;
    case 100: // num4
      adjustAmplitude(-1);
      break;
    case 102: // num6
      adjustAmplitude(+1);
      break;
    case 103: // num7
      adjustFrequency(-1);
      break;
    case 105: // num9
      adjustFrequency(+1);
      break;
  }
}

function adjustFrequency(change) {
  adjustInput(frequencyInput, change);
}

function adjustAmplitude(change) {
  adjustInput(amplitudeInput, change);
}

function adjustOffset(change) {
  adjustInput(offsetInput, change);
}

function adjustInput(input, change) {
  input.value = parseInt(input.value) + change * parseInt(input.step);
  input.dispatchEvent(new Event("change"));
}