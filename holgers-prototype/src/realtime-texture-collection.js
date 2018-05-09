import { createPlaneGeometry, createTexture, updateTexture, gridPosition3D, normalizedCoordinates, } from "./util.js";

class RealtimeTextureCollection extends THREE.Object3D {
  constructor(nofTextures) {
    super();

    // 64*64=4096 fugler, hver på 1024*1024 piksler
    // For mye! Max texture size på min GPU er 16384^2, max 16 texturer per object
    // Det blir 4096 texturer på 1024^2 piksler
    this.width = 1024;//*64;
    this.height = 1024;//*64;

    this.nofTextures = nofTextures;

    for (let i = 0; i < this.nofTextures; i++) {
      const texture = createTexture(this.width, this.height, new THREE.Color(0xffffff), 0.05*255);

      const material = new THREE.MeshBasicMaterial({
        transparent: true,
        map: texture,
      });

      const plane = new THREE.Mesh(new THREE.PlaneGeometry(1,1), material);
      plane.texture = texture;

      const gridPos = gridPosition3D(i, nofTextures);
      const normPos = normalizedCoordinates(gridPos)
      const pos = normPos.clone().multiplyScalar(2);
      plane.position.copy(pos);
      
      this.add(plane);
    }
  }

  updateImage(image, index) {
    console.log("Updating texture");

    const randomPos = new THREE.Vector2(Math.random()*this.width, Math.random()*this.height);
    const size = this.width/2;
    const randomColor = new THREE.Color(Math.random(), Math.random(), Math.random());
    randomColor.a = 1;

    const plane = this.children[index];
    
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

export default RealtimeTextureCollection;
