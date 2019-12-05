# nccamera

Electron integration for node-gphoto2.

## Usage

### Initialization

```javascript
const NCCamera = require('@nouvellecuisine/nccamera');

const nccamera = new NCCamera({
  autostart: true,
  callback: image => {
    // Do something with image
  },
});
```

The constructor takes a dictionary of options as parameter with the following keys:

- `autostart`: Boolean. Live Preview will be started automatically as soon as
  the camera is ready.
- `callback`: Function. Called for each frame of the Live Preview that should
  be displayed by the client.

### Trigger Auto-Focus

```javascript
nccamera.autofocus();
```

The camera will try to focus the current view.

`autofocus` takes no parameters. It returns a promise that resolves if
the command was sent successfully. However, there is no way to know
if the camera has finished focusing or has managed to do it.

### Capture Image

```javascript
nccamera.capture(autofocus).then(
  image => {
    // Do something with image
  },
  () => console.error('Capture failed')
);
```

The camera will take a picture.

`capture` takes one parameter:

- `autofocus`: Boolean. Tells the camera to trigger auto-focus before taking the
  picture. If true, the operation will be retried until focus is obtained or up to
  5 times.

This returns a promise which resolves with the image data. It fails if no focus
could be obtained.

### Capture Video

```javascript
nccamera.startVideo();

nccamera.stopVideo('/tmp/foo.mov').then(() => {
  // Process video file
});
```

The camera will take a video. `path` is the path on the host where video file will
be written.

Please note the following limitations:

- The video will not fit in the camera's RAM so a memory card should be inserted in
  the camera.
- The provided `path` should not exist, otherwise it will not be overwritten.
- A temporary file will be created in the same directory as the given `path`.

## Example of using image data

### Writing to a PixiJS texture

```javascript
// Create blob URL from data
const arraybuffer = Uint8Array.from(image).buffer;
const blob = new Blob([arraybuffer], { type: 'image/jpeg' });
const blobUrl = URL.createObjectURL(blob);

// Load it as an image, then draw as texture when the image is ready
const img = new Image();
img.addEventListener('load', () => {
  URL.revokeObjectURL(blobUrl);
  const texture = new PIXI.Texture(new PIXI.BaseTexture(img));
  const oldTexture = videoSprite.texture;
  videoSprite.texture = texture;
  oldTexture.destroy(true);
});
img.src = blobUrl;
```

### Writing to an image

```javascript
const encoded = Buffer.from(image).toString('base64');
document.getElementById('capture').src = 'data:image/jpeg;base64,' + encoded;
```

## Debug tools

The module includes a GUI debug tool that allows changing some configuration
settings on the camera. Press the `c` key on your keyboard to open it.
