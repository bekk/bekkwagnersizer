import { createPlaneGeometry, createTexture, updateTexture, gridPosition3D, normalizedCoordinates, } from "./util.js";


class RealtimeTextureCollection extends THREE.Object3D {
  constructor(nofTextures, width, height) {
    super();

    this.width = width;
    this.height = height;

    this.nofTextures = nofTextures;

    const texture = new THREE.TextureLoader().load("http://localhost:3000/troll.png");
    texture.magFilter = THREE.LinearFilter;
    texture.anisotropy = Math.pow(2, 3);

    for (let i = 0; i < this.nofTextures; i++) {

      const material = new THREE.MeshBasicMaterial({
        transparent: true,
        map: texture,
      });

      const plane = new THREE.Mesh(new THREE.PlaneGeometry(1,1), material);
      plane.texture = texture;

      const gridPos = gridPosition3D(i, nofTextures);
      const normPos = normalizedCoordinates(gridPos)
      const pos = normPos.clone().multiplyScalar(Math.ceil(Math.pow(nofTextures, 1/3) / 2));
      pos.multiplyScalar(-1); // For å få de første texturene til å være nærmere kamera
      plane.position.copy(pos);
      
      this.add(plane);
    }
  }

  updateImage(image, index) {
    console.log("Updating texture " + !!image);

    const plane = this.children[index];

    if (image) {
        plane.material.map = image;
        plane.material.map.anisotropy = Math.pow(2, 3);
        plane.material.needsUpdate = true;
    }

    if (!image) { // Tekstur for debug
      const randomPos = new THREE.Vector2(Math.random()*this.width, Math.random()*this.height);
      const size = this.width * 2/3;
      const randomColor = new THREE.Color(Math.random(), Math.random(), Math.random());
      randomColor.a = 1;
      
      updateTexture(plane.texture, (x, y) => {
        if (x > randomPos.x - size/2 && x < randomPos.x + size/2 &&
          y > randomPos.y - size/2 && y < randomPos.y + size/2) {
          randomColor.r = Math.random()/2;
          return randomColor;
        } else {
          return null;
        }
      })
    }
  }
}

export default RealtimeTextureCollection;
