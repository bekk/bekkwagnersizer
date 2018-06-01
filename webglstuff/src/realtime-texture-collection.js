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

    const loader = new THREE.TextureLoader();

    this.defaultTextures = [
      {metadata: this.getMetadata("hode-m-1.png"), texture: loader.load("http://localhost:3000/internal/hode-m-1.png")},
      {metadata: this.getMetadata("hode-m-2.png"), texture: loader.load("http://localhost:3000/internal/hode-m-2.png")},
      {metadata: this.getMetadata("hode-m-3.png"), texture: loader.load("http://localhost:3000/internal/hode-m-3.png")},
      {metadata: this.getMetadata("hode-m-4.png"), texture: loader.load("http://localhost:3000/internal/hode-m-4.png")},
      {metadata: this.getMetadata("hode-f-1.png"), texture: loader.load("http://localhost:3000/internal/hode-f-1.png")},
      {metadata: this.getMetadata("hode-f-2.png"), texture: loader.load("http://localhost:3000/internal/hode-f-2.png")},
      {metadata: this.getMetadata("hode-f-3.png"), texture: loader.load("http://localhost:3000/internal/hode-f-3.png")},
      {metadata: this.getMetadata("hode-f-4.png"), texture: loader.load("http://localhost:3000/internal/hode-f-4.png")},
    ];

    for (let sex in this.defaultTextures) {
      this.defaultTextures[sex].magFilter = THREE.LinearFilter;
      this.defaultTextures[sex].minFilter = THREE.LinearMipMapLinearFilter;
      this.defaultTextures[sex].anisotropy = Math.pow(2, 3);
    }

    this._bodies = {male: [], female: []};

    for (let i = 1; i <= 4; i++) {
      const filename = "kropp-m-"+i+".png";
      const metadata = this.getMetadata(filename);
      this._bodies.male.push({
        metadata: metadata,
        texture: loader.load("http://localhost:3000/internal/" + filename)
      });
    }

    for (let i = 1; i <= 4; i++) {
      const filename = "kropp-f-"+i+".png";
      const metadata = this.getMetadata(filename);
      this._bodies.female.push({
        metadata: metadata,
        texture: loader.load("http://localhost:3000/internal/" + filename)
      });
    }

        this._kcBodies = {male: [], female: []};

        for (let i = 1; i <= 4; i++) {
          const filename = "kropp-m-"+i+"-kc.png";
          const metadata = this.getMetadata(filename);
          this._kcBodies.male.push({
            metadata: metadata,
            texture: loader.load("http://localhost:3000/internal/" + filename)
          });
        }

        for (let i = 1; i <= 4; i++) {
          const filename = "kropp-f-"+i+"-kc.png";
          const metadata = this.getMetadata(filename);
          this._kcBodies.female.push({
            metadata: metadata,
            texture: loader.load("http://localhost:3000/internal/" + filename)
          });
        }
  }

  get nofTextures() {
      return this._nofTextures;
  }

  get bodies() {
    return this._bodies;
  }

  get kcBodies() {
    return this._kcBodies;
  }

  getDefault(sex, mal) {
    if (sex == undefined) sex = "female";
    if (mal == undefined) mal = 1;

    for (let defaultTexture of this.defaultTextures) {
      if (defaultTexture.metadata.sex == sex
        && defaultTexture.metadata.mal == mal) {
        return defaultTexture.texture;
      }
    }
    throw "Fant ikke default texture for " + sex + " " + mal;
  }

  getBody(sex, mal) {
    if (sex == undefined) sex = "female";
    if (mal == undefined) mal = 1;

    for (let body of this._bodies.male.concat(this._bodies.female)) {
      if (body.metadata.sex == sex
        && body.metadata.mal == mal) {
        return body.texture;
      }
    }
    throw "Fant ikke body for " + sex + " " + mal;
  }

  getBald() {
    return new THREE.TextureLoader().load("http://localhost:3000/internal/bald.png");
  }

  getShoulders() {
    return new THREE.TextureLoader().load("http://localhost:3000/internal/shoulders.png");;
  }

  updateImage(image, texture) {
    console.log("Updating texture " + !!image);
  }

  getMetadata(filename) {

    const mappings = {
      "hode-f-1.png": {mal: 1, animation: "people", sex: "female"},
      "hode-f-2.png": {mal: 2, animation: "manhattan", sex: "female"},
      "hode-f-3.png": {mal: 3, animation: "kingscross", sex: "female"},
      "hode-f-4.png": {mal: 4, animation: "people", sex: "female"},
      "hode-m-1.png": {mal: 1, animation: "people", sex: "male"},
      "hode-m-2.png": {mal: 2, animation: "manhattan", sex: "male"},
      "hode-m-3.png": {mal: 3, animation: "kingscross", sex: "male"},
      "hode-m-4.png": {mal: 4, animation: "people", sex: "male"},

      "hode-f-5.png": {mal: 1, animation: "people", sex: "female"},
      "hode-f-6.png": {mal: 2, animation: "manhattan", sex: "female"},
      "hode-f-7.png": {mal: 3, animation: "kingscross", sex: "female"},
      "hode-m-5.png": {mal: 1, animation: "people", sex: "male"},
      "hode-m-6.png": {mal: 2, animation: "manhattan", sex: "male"},
      "hode-m-7.png": {mal: 3, animation: "kingscross", sex: "male"},

      "kropp-f-1.png": {mal: 1, animation: "*", sex: "female"},
      "kropp-f-2.png": {mal: 2, animation: "*", sex: "female"},
      "kropp-f-3.png": {mal: 3, animation: "*", sex: "female"},
      "kropp-f-4.png": {mal: 4, animation: "*", sex: "female"},
      "kropp-m-1.png": {mal: 1, animation: "*", sex: "male"},
      "kropp-m-2.png": {mal: 2, animation: "*", sex: "male"},
      "kropp-m-3.png": {mal: 3, animation: "*", sex: "male"},
      "kropp-m-4.png": {mal: 4, animation: "*", sex: "male"},


      "kropp-f-1-kc.png": {mal: 1, animation: "*", sex: "female"},
      "kropp-f-2-kc.png": {mal: 2, animation: "*", sex: "female"},
      "kropp-f-3-kc.png": {mal: 3, animation: "*", sex: "female"},
      "kropp-f-4-kc.png": {mal: 4, animation: "*", sex: "female"},
      "kropp-m-1-kc.png": {mal: 1, animation: "*", sex: "male"},
      "kropp-m-2-kc.png": {mal: 2, animation: "*", sex: "male"},
      "kropp-m-3-kc.png": {mal: 3, animation: "*", sex: "male"},
      "kropp-m-4-kc.png": {mal: 4, animation: "*", sex: "male"},

    }

    if (mappings[filename]) return mappings[filename];
    else throw "IKKE IMPLEMENTERT for " + filename;
    //else return {mal: 4, animation: "*", sex: "male"}
  }
}

export default RealtimeTextureCollection;
