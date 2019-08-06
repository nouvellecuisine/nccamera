const debugToolbarPrefix = 'nccamera_debugtoolbar';
const debugToolbar = `
  <style type="text/css">
    #${debugToolbarPrefix} {
      position:absolute;
      top: 0;
      left: 0;
      width: 100%;
      background: #000;
      color: #fff;
      font-family: sans-serif;
    }
    #${debugToolbarPrefix} button {
      font-size: 1.5em;
      color: #FFF;
      background: #0CADA7;
      padding: 10px 30px;
      border-radius: 5px;
      margin: 10px 0;
      transition: all 0.2s ease-in-out;
    }
    #${debugToolbarPrefix} button:hover {
      background: #0A948F;
    }
  </style>
  <div id="${debugToolbarPrefix}">
    <div id="${debugToolbarPrefix}_status">Not connected</div>
    <div>
      White Balance: <select name=""><option>A</option></select> |
      Speed: <select name=""><option>A</option></select> |
      ISO: <select name=""><option>A</option></select> |
      Aperture: <select name=""><option>A</option></select> |
      Image Size: <select name=""><option>A</option></select>
    </div>
    <div>
      <button id="${debugToolbarPrefix}_start">Start live</button>
      <button id="${debugToolbarPrefix}_stop">Stop live</button>
      <button id="${debugToolbarPrefix}_focus">Focus</button>
    </div>
  </div>
`;

class Toolbar {
  container = null;
  nccamera = null;

  constructor(nccamera) {
    this.nccamera = nccamera;

    document.addEventListener('keyup', event => {
      if (event.keyCode === 67) {
        if (this.container) {
          this.hide();
        } else {
          this.show();
        }
      }
    });
  }

  show = () => {
    this.container = document.createElement('div');
    this.container.innerHTML = debugToolbar;
    document.body.appendChild(this.container);

    document
      .getElementById(`${debugToolbarPrefix}_start`)
      .addEventListener('click', this.nccamera.startLive);
    document
      .getElementById(`${debugToolbarPrefix}_stop`)
      .addEventListener('click', this.nccamera.stopLive);
    document
      .getElementById(`${debugToolbarPrefix}_focus`)
      .addEventListener('click', this.nccamera.autofocus);

    this.updateStatus();
  };

  hide = () => {
    document.body.removeChild(this.container);
    this.container = null;
  };

  updateStatus = () => {
    const status = document.getElementById(`${debugToolbarPrefix}_status`);
    if (status) {
      status.innerText = this.nccamera.camera
        ? `Connected to ${this.nccamera.camera.model}`
        : 'Not connected';
    }
  };
}

module.exports = Toolbar;
