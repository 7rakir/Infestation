var cameraText;
var terminalText;

const introductionText = `
  <p>You and your team noticed that a space station did not respond to your requests about the status near your destination at Omicron 6. As is the law, every spaceship has to investigate a potential power or oxygen defect when passing any vessel.</p>
  <p>While you were trying to reach anyone else assuming that the personnel at the station might require help, the rest of your crew approached and docked the station in one of your modules.</p>
  <p>Shortly after your crew entered the station, all communication went dark. After a while you finally managed to gain access to basic systems of the station. You now see that the station is severely damaged from the inside and is <u>infested by multiple dangerous organisms</u> in every room.</p>
  <p>As the crew's module was damaged due to the fight with several of these organisms, you now have to lead your crew to one of the station's escape module on the other side. However, the <u>doors between each room have been closed</u> to keep the integrity of the station intact and have to be <u>unlocked by finding the right signal</u> for each door.</p>
  <p>Lead your crew to safety before they are overrun.</p>
  </br>
  <p>Click to proceed &gt;</p>
`;

const helpText = `
  <p>Synchronize your red signal to the door green signal:</p>
  <ul>
    <li>NUM7: lower frequency</li>
    <li>NUM8: higher frequency</li>
    <li>NUM4: lower amplitude</li>
    <li>NUM5: higher amplitude</li>
    <li>NUM1: left offset</li>
    <li>NUM2: right offset</li>
  </ul>
  <p>Move your crew by keys:</p>
  <ul>
    <li>W: top</li>
    <li>A: left</li>
    <li>S: bottom</li>
    <li>D: right</li>
  </ul>
`;

const tileLockedText = "<p>Signal of the door already synchronized.</p>"

const winningText = "<p>Congratulations!</p><p>Your crew has escaped the horrors of the station.</p>";

const losingText = "<p>Game over!</p><p>Your crew has been overwhelmed by the organisms at the station.</p>";

class TextArea {
  constructor(id) {
    this.element = document.getElementById(id);
  }

  addText(text) {
    this.element.innerHTML = text;
  }

  show() {
    this.element.style.display = "block";
  }

  hide() {
    this.element.style.display = "none";
  }
}