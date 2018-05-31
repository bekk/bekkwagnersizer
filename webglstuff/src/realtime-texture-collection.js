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

    this.defaultTextures = {
      male: [
        new THREE.TextureLoader().load("http://localhost:3000/hode-m-5.png"),
        new THREE.TextureLoader().load("http://localhost:3000/hode-m-6.png"),
        new THREE.TextureLoader().load("http://localhost:3000/hode-m-7.png"),
        new THREE.TextureLoader().load("http://localhost:3000/hode-m-8.png"),
      ],
      female: [
        new THREE.TextureLoader().load("http://localhost:3000/hode-f-5.png"),
        new THREE.TextureLoader().load("http://localhost:3000/hode-f-6.png"),
        new THREE.TextureLoader().load("http://localhost:3000/hode-f-7.png"),
        new THREE.TextureLoader().load("http://localhost:3000/hode-f-8.png"),
      ],
    };

    for (let sex in this.defaultTextures) {
      this.defaultTextures[sex].magFilter = THREE.LinearFilter;
      this.defaultTextures[sex].minFilter = THREE.LinearMipMapLinearFilter;
      this.defaultTextures[sex].anisotropy = Math.pow(2, 3);
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

  getDefault(sex) {
    if (sex == undefined) sex = "male";
    return Random.pick(this.defaultTextures[sex]);
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

  getMetadata(filename) {

    const mappings = {
      "hode-f-1.png": {mal: 0, animation: "people", sex: "female"},
      "hode-f-2.png": {mal: 1, animation: "manhattan", sex: "female"},
      "hode-f-3.png": {mal: 2, animation: "kingscross", sex: "female"},
      "hode-m-1.png": {mal: 3, animation: "people", sex: "male"},
      "hode-m-2.png": {mal: 4, animation: "manhattan", sex: "male"},
      "hode-m-3.png": {mal: 5, animation: "kingscross", sex: "male"},
    }

    if (mappings[filename]) return mappings[filename];
    else throw "IKKE IMPLEMENTERT"
  }
}

export default RealtimeTextureCollection;
