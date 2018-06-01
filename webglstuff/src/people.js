import { createPlaneGeometry, 
  createTexture, 
  updateTexture, 
  gridPosition3D, 
  normalizedCoordinates, 
  normalize,
  Random,
  ratio, 
  addResizeListener,
  easeOutCubic,
} from "./util.js";

import RealtimeTextureCollection from "./realtime-texture-collection.js";
import PlingPlongTransition from "./pling-plong-transition.js";

// TODO: Pass på at nye bilder alltid havner inni midten

export default class People {

    constructor(renderer, textureCollection) {
        const cameraHeight = 0.25;
        const target = new THREE.Vector3(0, cameraHeight, 0);
        this._camera = new THREE.PerspectiveCamera(45, ratio(renderer), 0.01, 10000);
        this._camera.position.set(0, cameraHeight, 2.55);
        this._camera.lookAt(new THREE.Vector3(0, cameraHeight, 0));
        this._camera.updateProjectionMatrix();

        if (window.debug) {
          this.orbitControls = new THREE.OrbitControls(this._camera);
          this.orbitControls.target = target;
          this.orbitControls.update();

          this._camera.orbitControls = this.orbitControls;
        }

        this._scene = new THREE.Scene();

        this.peopleObject3D = new PeopleObject3D(textureCollection);
        this._scene.add(this.peopleObject3D);

        this.textureCollection = textureCollection;

        const purplePlane = new THREE.Mesh(
            new THREE.PlaneGeometry(5,2),
            new THREE.MeshBasicMaterial({
                color: new THREE.Color(0xbc1a8d),
            })
        );
        purplePlane.position.set(0, -0.5, 0.2);
        this._scene.add(purplePlane);

        const bluePlane = new THREE.Mesh(
            new THREE.PlaneGeometry(5,2),
            new THREE.MeshBasicMaterial({
                color: new THREE.Color(0x97eeff)
            })
        );
        bluePlane.position.set(0, 1.5, 0);
        this._scene.add(bluePlane);

        this.oldY = this._camera.position.y;

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

        if (window.debug) this.orbitControls.update();
    }

    zoomAmount(normalizedZoom) {
        const invertedNorm = 1 - normalizedZoom;

        const startZoom = 0.6;
        const endZoom = 1.0;
        this.camera.zoom = startZoom + normalizedZoom * (endZoom - startZoom);
        this.camera.updateProjectionMatrix();

        this.camera.position.y = this.oldY - invertedNorm * 0.4;
        if (window.debug) this.camera.orbitControls.target.y = this.camera.position.y ;
    }

    getIndexInBack(sex) {
        const distanceIndeces = [];

        const centerOfScreenLimit = 1.33;

        for (let i in this.peopleObject3D.children) {
          const child = this.peopleObject3D.children[i];
          if (child.sex == sex
            && Math.abs(child.position.x) < centerOfScreenLimit) {
              distanceIndeces.push({index: i, distance: child.position.z});
            }
        }

        distanceIndeces.sort(function(a, b) {
          return a.distance - b.distance;
        });

        return distanceIndeces[Random.int(0, 9)].index;
    }

    updateImage(image, metadata) {
        console.log("Updating texture in People", !!image, metadata);

        const index = this.getIndexInBack(metadata.sex)

        const plane = this.peopleObject3D.children[index];

        plane.material.map = image;
        plane.material.map.anisotropy = Math.pow(2, 3);
        //plane.material.map.minFilter = THREE.LinearMipMapLinearFilter;
        plane.material.needsUpdate = true;

        const body = this.textureCollection.getBody(metadata.sex, metadata.mal)
        plane.materialBody.map = body;
        plane.materialBody.map.anisotropy = Math.pow(2, 3);
        //plane.materialBody.map.minFilter = THREE.LinearMipMapLinearFilter;
        plane.materialBody.needsUpdate = true;
    }
}

// TODO: Sjekk med Audun om de jeg tror er damekropper er damer

class PeopleObject3D extends THREE.Object3D {
  constructor(textureCollection) {
    super();

    this.nofTextures = textureCollection.nofTextures;

    for (let i = 0; i < this.nofTextures; i++) {

      const sex = Random.pick(["female", "male"]);

      const body = Random.pick(textureCollection.bodies[sex]);
      const mal = body.metadata.mal;

      const material = new THREE.MeshBasicMaterial({
        transparent: true,
        map: body.texture,
        side: THREE.DoubleSide,
      });

      const plane = new THREE.Mesh(new THREE.PlaneGeometry(1,1), material);
      plane.scale.multiplyScalar(0.75);
      plane.position.y -= 0.14;
      
      const group = new THREE.Object3D();
      group.add(plane);

      const nofXDir = 20;
      const nofYDir = 20;

      group.pathPosition = Math.floor(i / nofYDir)/nofYDir + Random.float(0, 0.035);
      const magic = Math.floor(i / nofYDir) % 2 == 0;
      group.pathDeviance = (i % nofXDir + (magic ? 0.5 : 0))/nofXDir ;


      const textureHead = textureCollection.getDefault(sex, mal);

      const materialHead = new THREE.MeshBasicMaterial({
        transparent: true,
        map: textureHead,
        side: THREE.DoubleSide,
      });

      const face = new THREE.Mesh(new THREE.PlaneGeometry(0.4,0.4), materialHead);
      face.position.y += 0.18
      face.position.z += 0.1;
      //face.scale.multiplyScalar(1.85);
      group.material = materialHead;
      group.materialBody = material;
      group.add(face)

      group.scale.multiplyScalar(0.5);

      group.sex = sex;

      this.add(group);
    }
  }

  // TODO: Få opp folka bak raskere, pass på å ikke legg et nytt bilde ute på siden
  // TODO: Lag en snakkeboble på de nye personene
  // Lag Kings Cross statisk
  // TODO: Klipp ut bare nakken og oppover
  // -> malnummer-palettnummer-uuid.png

  getPath(position, deviance) {

    const speedUpLength = 0.1;
    const speedUpAmount = 3;

    position = position < 0.1 
      ? position * 3 
      : (0.1*3) + (position-0.1)/(1-0.1) * (1-0.1*3);

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
    const pathSpeed = 0.0002 * 5;

    for (let plane of this.children) {
      plane.pathPosition += pathSpeed;
      if (plane.pathPosition >= 1) plane.pathPosition = 0;
      plane.position.copy(this.getPath(plane.pathPosition, plane.pathDeviance));
    }
  }
}