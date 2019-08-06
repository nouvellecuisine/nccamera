const gphoto2 = require('@nouvellecuisine/gphoto2');

const Toolbar = require('./toolbar');

// Target video speed (TARGET_FRAME_TIME=1000/FPS, set 0 for maximum speed)
const TARGET_FRAME_TIME = Math.round(1000 / 25);

class NCCamera {
  GPhoto = null;
  camera = null;
  running = false;
  frameStart = 0;
  frameEnd = 0;
  autostart = true;
  callback = null;
  toolbar = null;

  constructor({ autostart = true, callback }) {
    this.autostart = autostart;
    this.callback = callback;

    this.toolbar = new Toolbar(this);

    this.hotplug();

    window.onbeforeunload = this.stopLive;
  }

  hotplug = () => {
    this.setup().then(
      () => {
        return this.getSettings().then(
          settings => {
            console.log('Got settings', settings);
            if (settings) {
              if (this.autostart) {
                return this.startLive();
              }
            } else {
              setTimeout(this.hotplug, 1000);
            }
          },
          error => {
            console.warn('Could not talk to camera', error);
            setTimeout(this.hotplug, 1000);
          }
        );
      },
      error => {
        console.error('NCCameraClient', 'Failed opening camera:', error);
        setTimeout(this.hotplug, 1000);
      }
    );
  };

  setup = () => {
    console.log('NCCamera', 'Doing setup', this.GPhoto);

    if (this.camera !== null) {
      console.log('NCCamera', 'Existing camera object discarded');
      delete this.camera;
      this.camera = null;
      this.toolbar.updateStatus();
    }

    if (this.GPhoto !== null) {
      console.log('NCCamera', 'Existing GPhoto instance discarded');
      delete this.GPhoto;
      this.GPhoto = null;
    }

    console.log('NCCamera', 'Initialize GPhoto');
    this.GPhoto = new gphoto2.GPhoto2();
    this.GPhoto.setLogLevel(1);
    this.GPhoto.on('log', function(level, domain, message) {
      console.log('NCCamera', domain, message);
    });

    return new Promise((resolve, reject) => {
      this.GPhoto.list(list => {
        if (list.length === 0) {
          console.warn('NCCamera', 'No camera found');
          reject('No camera found');
          return;
        }

        this.camera = list[0];
        this.toolbar.updateStatus();
        console.log('NCCamera', 'Found', this.camera.model);

        resolve(this.camera);
      });
    });
  };

  startLive = event => {
    if (this.running) {
      console.warn('NCCamera', 'Live is already running');
      return;
    }

    if (this.camera === null) {
      console.warn(
        'NCCamera',
        'No camera found, please check camera and call setup'
      );
      return;
    }

    console.log('NCCamera', 'Starting live');
    this.running = true;
    this.runLive();
  };

  stopLive = () => {
    if (!this.running) {
      console.warn('NCCamera', 'Live is not running');
      return;
    }

    console.log('NCCamera', 'Stopping live');
    this.running = false;
  };

  runLive = () => {
    if (this.camera === null) {
      console.warn('NCCamera', 'No camera detected');
      return;
    }

    this.frameStart = Date.now();

    this.camera.takePicture(
      {
        preview: true,
        download: true,
      },
      (er, data) => {
        if (er < 0) {
          console.warn(
            'NCCamera',
            'Error received from camera, stopping live',
            er
          );
          this.stopLive();
          this.hotplug();
        } else {
          if (data) {
            if (this.callback) {
              this.callback(data);
            }
          } else {
            console.warn('NCCamera', 'Empty data received from camera', er);
          }

          if (this.running) {
            this.frameEnd = Date.now();
            const work = this.frameEnd - this.frameStart;
            const sleep = Math.max(TARGET_FRAME_TIME - work, 0);
            setTimeout(this.runLive, sleep);
          }
        }
      }
    );
  };

  capture = () => {
    if (this.camera === null) {
      console.warn('NCCamera', 'No camera detected');
      return;
    }

    return new Promise((resolve, reject) => {
      this.camera.takePicture(
        {
          preview: false,
          download: true,
        },
        (er, data) => {
          if (er < 0) {
            console.warn(
              'NCCamera',
              'Error received from camera, stopping live',
              er
            );
            reject(er);
          } else {
            if (data) {
              resolve(data);
              return;
            } else {
              console.warn('NCCamera', 'Empty data received from camera', er);
            }
          }
        }
      );
    });
  };

  autofocus = () => {
    return this.setSetting('cancelautofocus', 1).then(
      this.setSetting('autofocusdrive', 1)
    );
  };

  getSettings = () => {
    if (this.camera === null) {
      console.warn('NCCamera', 'No camera detected');
      return Promise.reject('No camera detected');
    }

    console.log('NCCamera', 'Get settings');
    return new Promise(resolve => {
      this.camera.getConfig((er, settings) => {
        console.log('NCCamera', 'Settings retrieved');
        resolve(settings);
      });
    });
  };

  setSetting = (key, value) => {
    if (this.camera === null) {
      console.warn('NCCamera', 'No camera detected');
      return Promise.reject('No camera detected');
    }

    return new Promise((resolve, reject) => {
      this.camera.setConfigValue(key, value, er => {
        if (er < 0) {
          reject('Cannot set config', er);
        } else {
          resolve();
        }
      });
    });
  };
}

module.exports = NCCamera;
