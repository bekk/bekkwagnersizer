function createPlaneGeometry(height, width) {
  const geometry = new THREE.PlaneGeometry();
  geometry.vertices[0].set(height/2, 0, -width/2);
  geometry.vertices[1].set(height/2, 0, width/2);
  geometry.vertices[2].set(-height/2, 0, -width/2);
  geometry.vertices[3].set(-height/2, 0, width/2);

  return geometry;
}

function createTexture(width, height, color, alpha) {
  var size = width * height;
  var data = new Uint8Array(4 * size);

  if (color === undefined) color = new THREE.Color(0xFFFFFF);
  if (alpha === undefined) alpha = 255;

  var r = Math.floor(color.r * 255);
  var g = Math.floor(color.g * 255);
  var b = Math.floor(color.b * 255);
  var a = alpha;

  for (var i = 0; i < size; i++) {
    data[i * 4 + 0] = r;
    data[i * 4 + 1] = g;
    data[i * 4 + 2] = b;
    data[i * 4 + 3] = a;
  }

  var texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat);
  texture.needsUpdate = true;

  return texture;
}

function updateTexture(texture, pixelCallback) {
  var width = texture.image.width;
  var height = texture.image.height;
  var nofPixels = texture.image.data.length/4;

  for (var i = 0; i < nofPixels; i++) {
    var x = i%width;
    var y = Math.floor(i/width);

    var rgba = pixelCallback(x, y);

    if (rgba) {
      texture.image.data[i*4] = rgba.r*255;
      texture.image.data[i*4+1] = rgba.g*255;
      texture.image.data[i*4+2] = rgba.b*255;
      texture.image.data[i*4+3] = rgba.a*255;
    }
  }

  texture.needsUpdate = true;

  return texture;
}

function gridPosition2D(i, totalNofTiles) {
  const square = Math.floor(Math.sqrt(totalNofTiles));

  const x = i % square;
  const y = Math.floor(i / square);

  return new THREE.Vector2(x, y).addScalar(0.5).multiplyScalar(1/square);
}

function gridPosition3D(i, totalNofCubes) {
  const cube = Math.round(Math.pow(totalNofCubes, 1/3));

  const x = i % cube;
  const y = Math.floor(i / Math.pow(cube, 2))
  const z = Math.floor(i / cube) % cube;

  return new THREE.Vector3(x, y, z).addScalar(0.5).multiplyScalar(1/cube);
}

function normalizedCoordinates(vector) {
  return vector.clone().multiplyScalar(2).subScalar(1);
}

function normalize(float, max) {
  if (!max) max = 1;
  return float * 2 - 1;
}

function fetchTextureFromServer(url, callback, errorCallback) {
  const loader = new THREE.TextureLoader();

  return loader.load(
    url,

    function onLoad(image) {
      if (callback) callback(image);
    },

    function onProgress() {

    },

    function onError(err) {
      console.error('Could not load texture from server', url);
      if (errorCallback) errorCallback(err);
    }
  );
}

export const ratio = (renderer) =>
  renderer.getContext().drawingBufferWidth /
  renderer.getContext().drawingBufferHeight;


export const Random = {
    float: function(from, to) {
        return Math.random()*(to-from)+from;
    },

    int: function(from, to) {
       return Math.floor(this.float(from, to+1));
    },
    bool: function(probability) {
        return Math.random() < probability;
    },
    pick: function(array) {
        return array[this.int(0, array.length - 1)];
    },
}

export const addResizeListener = function(camera, renderer) {
  window.addEventListener('resize', function() {
    var height = window.innerHeight;
    renderer.setSize(window.innerWidth, height);
    camera.aspect = window.innerWidth / height;
    camera.updateProjectionMatrix();

    // TODO: Does not handle updating dimensions of Orthographic camera
  });
}

// TODO: Make it return BufferGeometry (must move attributes.position instead of vertices)
export const planeBufferGeometry = function(direction, width, height) {
  if (width == undefined) width = 1;
  if (height == undefined) height = 1;

  let geometry = new THREE.PlaneGeometry(width, height);

  if (direction == 'ZY') {
    geometry.vertices[0].set(0, width/2, -width/2);
    geometry.vertices[1].set(0, width/2, width/2);
    geometry.vertices[2].set(0, -height/2, height/2);
    geometry.vertices[3].set(0, -height/2, -height/2);
    geometry.faces[0].a = 1;
    geometry.faces[0].b = 2;
    geometry.faces[0].c = 0;
    geometry.faces[1].a = 2;
    geometry.faces[1].b = 3;
    geometry.faces[1].c = 0;
  } else {
    throw "direction not implemented"
  }

  return geometry;
}

export class Timer {
    constructor() {
        this.timeStartMillis = new Date().getTime();
    }

    start() {
        this.timeStartMillis = new Date().getTime();
    }

    get() {
        return (new Date().getTime() - this.timeStartMillis) / 1000;
    }
}


export const easeOutCubic = function(t) {
  t--;
  return t*t*t + 1.0;
}

export const easeOutQuadratic = function(t) {
  t--;
  return 1-t*t;
}

export const easeInOutSine = function(t) {
  return (Math.sin(t*Math.PI - Math.PI/2) + 1) / 2;
}

export const clamp = function(t, min, max) {
  return Math.max(Math.min(t, max), min);
}

export const computeGeometry = function(geometry) {
  geometry.verticesNeedUpdate = true;
  geometry.elementsNeedUpdate = true;
  geometry.uvsNeedUpdate = true;
  geometry.normalsNeedUpdate = true;
  geometry.tangentsNeedUpdate = true;
  geometry.colorsNeedUpdate = true;
  geometry.lineDistancesNeedUpdate = true;
  geometry.buffersNeedUpdate = true;
  geometry.groupsNeedUpdate = true;

  geometry.computeVertexNormals()
  geometry.computeFaceNormals();
  geometry.computeMorphNormals();
  geometry.computeBoundingSphere();
  geometry.computeBoundingBox();
}

export {
  createPlaneGeometry,
  createTexture,
  updateTexture,
  gridPosition3D,
  normalizedCoordinates,
  fetchTextureFromServer,
  normalize,
}

export function pad(n, width, z) {
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

export function getImageData(image) {
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;

  const context = canvas.getContext('2d');
  context.drawImage(image, 0, 0);

  return context.getImageData(0, 0, image.width, image.height);
}

export function getPixel(imagedata, x, y) {
  const position = (x + imagedata.width * y) * 4;
  const data = imagedata.data;
  return {
    r: data[position + 0],
    g: data[position + 1],
    b: data[position + 2],
    a: data[position + 3]
  };
}

export function setPixel(imagedata, x, y, pixel) {
  const position = (x + imagedata.width * y) * 4;
  const data = imagedata.data;
  data[position + 0] = pixel.r;
  data[position + 1] = pixel.g;
  data[position + 2] = pixel.b;
  data[position + 3] = pixel.a;
}

export function scaleImageData(imagedata, newWidth, newHeight) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  const scaled = context.createImageData(newWidth, newHeight);

  for (let x = 0; x < newWidth; x++) {
    for (let y = 0; y < newHeight; y++) {
      const sampledX = Math.floor(x * imagedata.width / newWidth);
      const sampledY = Math.floor(y * imagedata.height / newHeight);

      const sampledPixel = getPixel(imagedata, sampledX, sampledY);

      setPixel(scaled, x, y, sampledPixel);
    }
  }

  return scaled;
}

export function imageDataToString(imagedata) {
  let str = "";

  for (let y = 0; y < imagedata.height; y++) {
    for (let x = 0; x < imagedata.width; x++) {
      const pixel = getPixel(imagedata, x, y);

      let colorCharacter = '_' // Transparent

      if (pixel.a > 255/2) {
        if (Math.max(pixel.r, pixel.g, pixel.b) < 0.2*255) {
          colorCharacter = "#"; // Black
        } else if (Math.min(pixel.r, pixel.g, pixel.b) > 0.8*255) {
          colorCharacter = " "; // White
        } else if (pixel.r > pixel.g && pixel.r > pixel.b) {
          colorCharacter = "R";
        } else if (pixel.g > pixel.r && pixel.g > pixel.b) {
          colorCharacter = "G";
        } else {
          colorCharacter = "B";
        }
      }

      str += colorCharacter;
    }

    str += '\n';
  }

  return str;
}

export function formatTime(timeSeconds) {
  const seconds = Math.floor(timeSeconds);
  const millis = Math.round((timeSeconds - seconds) * 1000);
  return `t = ${seconds}.${pad(millis, 3)}`;
}
