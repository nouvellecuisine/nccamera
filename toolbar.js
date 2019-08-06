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
    <div><ul id="${debugToolbarPrefix}_settings"></ul></div>
    <div>
      <button id="${debugToolbarPrefix}_start">Start live</button>
      <button id="${debugToolbarPrefix}_stop">Stop live</button>
      <button id="${debugToolbarPrefix}_focus">Focus</button>
    </div>
  </div>
`;

// autopoweroff, imageformat, whitebalance, iso
const CAMERA_SETTINGS = [
  // Root categories
  'capturesettings',
  'imgsettings',
  'settings',
  // Settings we need
  'autopoweroff',
  'imageformat',
  'whitebalance',
  'iso',
  'shutterspeed',
  'aperture',
];

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
    this.updateSettings();
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

  updateSettings = () => {
    function showSetting(key, setting, container) {
      const changeCheckbox = event => {
        console.log(
          'change checkbox',
          event.target.name,
          'to',
          event.target.checked ? 1 : 0
        );
        nccamera.setSetting(event.target.name, event.target.checked ? 1 : 0);
      };
      const changeSelect = event => {
        console.log(
          'change select',
          event.target.name,
          'to',
          event.target.value
        );
        nccamera.setSetting(event.target.name, event.target.value);
      };

      const node = document.createElement('li');
      node.innerText = setting.label;
      if (setting.value !== undefined) {
        if (setting.type === 'choice') {
          const select = document.createElement('select');
          select.setAttribute('name', key);
          for (const choice of setting.choices) {
            if (choice.indexOf('Unknown') !== -1) {
              continue;
            }
            const option = document.createElement('option');
            option.setAttribute('value', choice);
            if (setting.value === choice) {
              option.setAttribute('selected', 'selected');
            }
            option.innerText = choice;
            select.appendChild(option);
          }
          select.onchange = changeSelect;
          node.appendChild(select);
        } else if (setting.type === 'toggle') {
          const checkbox = document.createElement('input');
          checkbox.setAttribute('type', 'checkbox');
          checkbox.setAttribute('name', key);
          if (setting.value > 0) {
            checkbox.setAttribute('checked', 'checked');
          }
          checkbox.onchange = changeCheckbox;
          node.appendChild(checkbox);
        } else {
          node.innerText = `${setting.label}: ${setting.value}`;
        }
      }

      if (setting.children) {
        const childList = document.createElement('ul');
        for (const i in setting.children) {
          if (CAMERA_SETTINGS.indexOf(i) > -1) {
            showSetting(i, setting.children[i], childList);
          }
        }
        node.appendChild(childList);
      }
      container.appendChild(node);
    }

    this.nccamera.getSettings().then(settings => {
      console.log('Got settings', settings);
      showSetting(
        'main',
        settings.main,
        document.getElementById(`${debugToolbarPrefix}_settings`)
      );
    });
  };
}

module.exports = Toolbar;
