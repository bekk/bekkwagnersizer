import { createPlaneGeometry, 
  createTexture, 
  updateTexture, 
  gridPosition3D, 
  normalizedCoordinates, 
  normalize,
  Random,
  ratio, 
  addResizeListener 
} from "./util.js";

import RealtimeTextureCollection from "./realtime-texture-collection.js";

export default class People {

    constructor(renderer, textureCollection) {
        const cameraHeight = 0.4;
        this._camera = new THREE.PerspectiveCamera(45, ratio(renderer), 0.1, 10000);
        this._camera.position.set(0, cameraHeight, 2.55);
        this._camera.updateProjectionMatrix();

        this.orbitControls = new THREE.OrbitControls(this._camera);
        this.orbitControls.target = new THREE.Vector3(0, cameraHeight, 0);
        this.orbitControls.update();

        this._scene = new THREE.Scene();

        this.peopleObject3D = new PeopleObject3D(textureCollection);
        this._scene.add(this.peopleObject3D);

        const purplePlane = new THREE.Mesh(
            new THREE.PlaneGeometry(5,2),
            new THREE.MeshBasicMaterial({
                color: new THREE.Color(0xbc1a8d)
            })
        );
        purplePlane.position.set(0, -0.5, 0.2);
        this._scene.add(purplePlane);

        var lightSun = new THREE.DirectionalLight(0xffffff, 1.0);
        lightSun.position.set(-0.5, 4, 1).normalize();
        this._scene.add(lightSun);

        addResizeListener(this._camera, renderer);
    }

    get scene() {
        return this._scene;
    }

    get camera() {
        return this._camera;
    }

    animate() {
        this.peopleObject3D.updatePositions();

        this.orbitControls.update();
    }

    getIndexInBack() {
        const distanceIndeces = [];

        for (let i in this.peopleObject3D.children) {
          const child = this.peopleObject3D.children[i];
          distanceIndeces.push({index: i, distance: child.position.z});
        }

        distanceIndeces.sort(function(a, b) {
          return a.distance - b.distance;
        });

        return distanceIndeces[Random.int(0, 9)].index;
    }

    updateImage(image) {
        console.log("Updating texture " + !!image);

        const index = this.getIndexInBack()

        const plane = this.peopleObject3D.children[index];

        plane.material.map = image;
        //plane.material.map.anisotropy = Math.pow(2, 3);
        //plane.material.map.minFilter = THREE.LinearMipMapLinearFilter;
        plane.material.needsUpdate = true;
    }
}

class PeopleObject3D extends THREE.Object3D {
  constructor(textureCollection) {
    super();

    this.nofTextures = textureCollection.nofTextures;

    for (let i = 0; i < this.nofTextures; i++) {

        const textureBody = Random.pick(textureCollection.bodies.male.concat(textureCollection.bodies.female));

      const material = new THREE.MeshBasicMaterial({
        transparent: true,
        map: textureBody,
        side: THREE.DoubleSide,
      });

      const plane = new THREE.Mesh(new THREE.PlaneGeometry(1,1), material);
      
      const group = new THREE.Object3D();
      group.add(plane);

      const nofXDir = 10;
      const nofYDir = 10;

      group.pathPosition = Math.floor(i / nofYDir)/nofYDir + Random.float(0, 0.05);
      const magic = Math.floor(i / nofYDir) % 2 == 0;
      group.pathDeviance = (i % nofXDir + (magic ? 0.5 : 0))/nofXDir ;


      const textureHead = textureCollection.getDefault();

      const materialHead = new THREE.MeshBasicMaterial({
        transparent: true,
        map: textureHead,
        side: THREE.DoubleSide,
      });

      const face = new THREE.Mesh(new THREE.PlaneGeometry(0.4,0.4), materialHead);
      face.position.y += 0.18
      face.position.z += 0.03;
      group.material = materialHead;
      group.add(face)

      this.add(group);
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
    const skew = 0.30;
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