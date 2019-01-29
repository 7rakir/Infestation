var cameraText;
var terminalText;

const introductionText = `
  <h1>Reckless</h1>

  <p>Location: Orbit of Omicron 6<br />
  Date: November 30, 2279</p>
  <p>You and your team noticed that a space station did not respond to your requests about the status near your destination at Omicron 6. As is the law, every spaceship has to investigate a potential power or oxygen defect when passing any vessel.</p>
  <p>While you were trying to reach anyone else assuming that the personnel at the station might require further help, the rest of your squad approached and docked the station in one of your modules.</p>
  <p>Shortly after your squad entered the station, all communication went dark. After a while you finally managed to gain access to basic systems of the station. You now see that the station is severely damaged from the inside and is <u>infested by multiple dangerous organisms</u> in every room.</p>
  <p>As the squad's module was damaged due to the fight with several of these organisms, you now have to lead your squad to one of the station's own escape modules on the other side. However, the <u>doors between each room have been automatically locked</u> to keep the integrity of the station intact and have to be <u>unlocked by finding the right signal</u> for each door.</p>
  <p>Lead your squad to safety before they are overrun.</p>
  </br>
  <p>&gt; Press any key to continue</p>
`;

const helpText = `
  <p>Synchronize your green signal to the red door signal:</p>
  <ul>
    <li>NUM7: lower frequency</li>
    <li>NUM8: higher frequency</li>
    <li>NUM4: lower amplitude</li>
    <li>NUM5: higher amplitude</li>
    <li>NUM1: left offset</li>
    <li>NUM2: right offset</li>
  </ul>
  <p>Move your squad by keys:</p>
  <ul>
    <li>W: top</li>
    <li>A: left</li>
    <li>S: bottom</li>
    <li>D: right</li>
  </ul>
`;

const tileLockedText = "<p>Signal of the door already synchronized.</p>"

const winningText = `
  <p>Congratulations!</p>
  <p>Your squad has escaped the horrors of the station.</p>
  <p>As the escape module slowly approaches your spaceship you prepare it for a route towards Omicron 6. With the help of the planet's new colony, you will reclaim the station.</p>
`;

const losingText = `
  <p>Game over!</p>
  <p>Your squad has been overwhelmed by the organisms at the station.</p>
  <p>Blaming yourself for their deaths you start the engines of your spaceship and quickly set off to Omicron 6. Hopefully its new colony can help you with the station's infestation...</p>
`;

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