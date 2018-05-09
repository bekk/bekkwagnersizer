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

export {
  createPlaneGeometry,
  createTexture,
  updateTexture,
  gridPosition3D,
  normalizedCoordinates,
}