import { createPlaneGeometry, 
  createTexture, 
  updateTexture, 
  gridPosition3D, 
  normalizedCoordinates, 
  normalize,
  Random,
} from "./util.js";

class RealtimeTextureCollection {
  constructor(nofTextures, width, height) {
    this.width = width;
    this.height = height;

    this._nofTextures = nofTextures;

    const texture = new THREE.TextureLoader().load("http://localhost:3000/head-male-01.png");
    //const texture = new THREE.TextureLoader().load("http://localhost:3000/tysseng-.png");
    texture.magFilter = THREE.LinearFilter;
    //{texture.minFilter = THREE.LinearMipMapLinearFilter;
    texture.anisotropy = Math.pow(2, 3);
    
    //this.textures.push(texture);

    const loader = new THREE.TextureLoader();

    this._bodies = {male: [], female: []};
    this._bodies.male.push(loader.load("http://localhost:3000/body-male-01.png"));
    this._bodies.male.push(loader.load("http://localhost:3000/body-male-02.png"));
    this._bodies.female.push(loader.load("http://localhost:3000/body-female-01.png"));
    this.defaultTexture = texture;
  }

  get nofTextures() {
      return this._nofTextures;
  }

  get bodies() {
    return this._bodies;
  }

  getDefault() {
    return this.defaultTexture;
  }

  updateImage(image, texture) {
    console.log("Updating texture " + !!image);

    //const plane = this.children[index];

    if (image) {
          //plane.material.map = image;
        //plane.material.map.anisotropy = Math.pow(2, 3);
        //plane.material.map.minFilter = THREE.LinearMipMapLinearFilter;
          //plane.material.needsUpdate = true;
    }
  }
}

export default RealtimeTextureCollection;
