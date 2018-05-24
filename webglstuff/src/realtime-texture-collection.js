import { createPlaneGeometry, 
  createTexture, 
  updateTexture, 
  gridPosition3D, 
  normalizedCoordinates, 
  normalize,
  Random,
} from "./util.js";


class RealtimeTextureCollection extends THREE.Object3D {
  constructor(nofTextures, width, height) {
    super();

    this.width = width;
    this.height = height;

    this.nofTextures = nofTextures;

    const texture = new THREE.TextureLoader().load("http://localhost:3000/People_karakterer_mai-03.png");
    //const texture = new THREE.TextureLoader().load("http://localhost:3000/tysseng-.png");
    texture.magFilter = THREE.LinearFilter;
    //{texture.minFilter = THREE.LinearMipMapLinearFilter;
    //texture.anisotropy = Math.pow(2, 3);

    for (let i = 0; i < this.nofTextures; i++) {
      const material = new THREE.MeshBasicMaterial({
        transparent: true,
        map: texture,
        side: THREE.DoubleSide,
      });

      const plane = new THREE.Mesh(new THREE.PlaneGeometry(1,1), material);
      plane.texture = texture;

      const nofXDir = 10;
      const nofYDir = 10;

      plane.pathPosition = Math.floor(i / nofYDir)/nofYDir + Random.float(0, 0.05);
      const magic = Math.floor(i / nofYDir) % 2 == 0;
      plane.pathDeviance = (i % nofXDir + (magic ? 0.5 : 0))/nofXDir ;
      
      this.add(plane);
    }
  }

  getIndexInBack() {
    const distanceIndeces = [];
    
    for (let i in this.children) {
      const child = this.children[i];
      distanceIndeces.push({index: i, distance: child.position.z});
    }

    distanceIndeces.sort(function(a, b) {
      return a.distance - b.distance;
    });
    
    return distanceIndeces[Random.int(0, 9)].index;
  }

  updateImage(image, index) {
    console.log("Updating texture " + !!image);

    const plane = this.children[index];

    if (image) {
        plane.material.map = image;
        //plane.material.map.anisotropy = Math.pow(2, 3);
        //plane.material.map.minFilter = THREE.LinearMipMapLinearFilter;
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

  // TODO: Få opp folka bak raskere, pass på å ikke legg et nytt bilde ute på siden
  // TODO: Lag en snakkeboble på de nye personene
  // Lag Kings Cross statisk
  // TODO: Klipp ut bare nakken og oppover
  // -> malnummer-palettnummer-uuid.png

  getPath(position, deviance) {
    const spreadX = 2;
    const spreadY = 1.35;
    const skew = 0.25;
    const scaledPosition = (position*(1-skew) + skew)
    return new THREE.Vector3(
      normalize(deviance) * spreadX,
      normalize(Math.sin(scaledPosition * Math.PI)) * spreadY/2,
      position + deviance*0.01,
    );
  }

  updatePositions() {
    const pathSpeed = 0.0005;

    for (let plane of this.children) {
      plane.pathPosition += pathSpeed;
      if (plane.pathPosition >= 1) plane.pathPosition = 0;
      plane.position.copy(this.getPath(plane.pathPosition, plane.pathDeviance));
    }
  }
}

export default RealtimeTextureCollection;
