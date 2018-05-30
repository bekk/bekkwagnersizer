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
      new THREE.TextureLoader().load("http://localhost:3000/hode-m-1.png"),
      new THREE.TextureLoader().load("http://localhost:3000/hode-f-1.png"),
    ];

    for (let defaultTexture of this.defaultTextures) {
      defaultTexture.magFilter = THREE.LinearFilter;
      defaultTexture.minFilter = THREE.LinearMipMapLinearFilter;
      defaultTexture.anisotropy = Math.pow(2, 3);
    }

    const loader = new THREE.TextureLoader();

    this._bodies = {male: [], female: []};

    for (let i = 1; i <= 16; i++) {
      this._bodies.male.push(loader.load("http://localhost:3000/kropp-m-"+i+".png"));
    }

    for (let i = 1; i <= 10; i++) {
      this._bodies.female.push(loader.load("http://localhost:3000/kropp-f-"+i+".png"));
    }
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
