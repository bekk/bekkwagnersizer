import { createPlaneGeometry, 
  createTexture, 
  updateTexture, 
  gridPosition3D, 
  normalizedCoordinates, 
  normalize,
  Random,
} from "./util.js";

class RealtimeTextureCollection {
  constructor(nofTextures) {

    this._nofTextures = nofTextures;

    this.defaultTextures = [
      new THREE.TextureLoader().load("http://localhost:3000/default1.png"),
      new THREE.TextureLoader().load("http://localhost:3000/default2.png"),
    ];

    for (let defaultTexture of this.defaultTextures) {
      defaultTexture.magFilter = THREE.LinearFilter;
      defaultTexture.minFilter = THREE.LinearMipMapLinearFilter;
      defaultTexture.anisotropy = Math.pow(2, 3);
    }

    const loader = new THREE.TextureLoader();

    this._bodies = {male: [], female: []};
    
    this._bodies.male.push(loader.load("http://localhost:3000/body-male-01.png"));
    this._bodies.male.push(loader.load("http://localhost:3000/body-male-02.png"));
    this._bodies.female.push(loader.load("http://localhost:3000/body-female-01.png"));
  }

  get nofTextures() {
      return this._nofTextures;
  }

  get bodies() {
    return this._bodies;
  }

  getDefault() {
    return Random.pick(this.defaultTextures);
  }

  getBald() {
    return new THREE.TextureLoader().load("http://localhost:3000/bald.png");
  }

  getShoulders() {
    return new THREE.TextureLoader().load("http://localhost:3000/shoulders.png");;
  }

  updateImage(image, texture) {
    console.log("Updating texture " + !!image);
  }
}

export default RealtimeTextureCollection;
