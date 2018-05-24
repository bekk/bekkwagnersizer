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

    const texture = new THREE.TextureLoader().load("http://localhost:3000/People_karakterer_mai-03.png");
    //const texture = new THREE.TextureLoader().load("http://localhost:3000/tysseng-.png");
    texture.magFilter = THREE.LinearFilter;
    //{texture.minFilter = THREE.LinearMipMapLinearFilter;
    //texture.anisotropy = Math.pow(2, 3);
    
    //this.textures.push(texture);

    this.defaultTexture = texture;
  }

  get nofTextures() {
      return this._nofTextures;
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
