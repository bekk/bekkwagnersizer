import { createPlaneGeometry, 
  createTexture, 
  updateTexture, 
  gridPosition3D, 
  normalizedCoordinates, 
  normalize,
  Random,
  ratio, 
  addResizeListener,
  Timer,
  easeOutCubic,
} from "./util.js";

import RealtimeTextureCollection from "./realtime-texture-collection.js";

export default class Telly {

    constructor(renderer, textureCollection) {
        const width = renderer.getContext().drawingBufferWidth;
        const height = renderer.getContext().drawingBufferHeight;
        const zoom = 1800;
        this._camera = new THREE.OrthographicCamera(width / -zoom, width / zoom, height / zoom, height / -zoom, 0.1, 1000);
        this._camera.position.set(1.0, 0.37, 20);
        this._camera.updateProjectionMatrix();

        this.orbitControls = new THREE.OrbitControls(this._camera);
        this.orbitControls.target = this._camera.position.clone().sub(new THREE.Vector3(0, 0, this._camera.position.z));
        this.orbitControls.update();

        this._scene = new THREE.Scene();

        this.TVs = [];

        for (let x = 0; x < 8; x++) {
          for (let y = 0; y < 4; y++) {
            const i = this.TVs.length;
            const tv = new TV(textureCollection, i * 2 + 1);
            tv.position.x += 0.25*x;
            tv.position.y += 0.25*y;
            tv.position.z += 0.1*i;
            this._scene.add(tv);
            this.TVs.push(tv)
          }
        }

        const gridMaterial = new THREE.MeshBasicMaterial({
          map: new THREE.TextureLoader().load("http://localhost:3000/grid.png"),
          transparent: true,
        });
        for (let i = 0; i < 4; i++) {
          const grid = new THREE.Mesh(new THREE.PlaneGeometry(0.51, 1.01), gridMaterial)
          grid.position.set(0.125 + 1.0/2*i, 0.37, 4)
          grid.renderOrder = 1000;
          this._scene.add(grid);
        }

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
        for (let tv of this.TVs) {
          tv.animate();
        }

        this.orbitControls.update();
    }

    updateImage(image) {
        console.log("Updating texture in Telly " + !!image);

        const tv = Random.pick(this.TVs);

        tv.updateImage(image);
    }
}

class TV extends THREE.Object3D {
  constructor(textureCollection, order) {
    super();

    this.sketches = [
      new SlideInFromSides(textureCollection),
      new ZoomOut(textureCollection),
      new Skip(textureCollection),
    ];

    this.timeOffset = Random.float(0, 2);
    this.timer = new Timer();

    for (let sketch of this.sketches) {
      sketch.visible = false;
      sketch.traverse((child) => child.renderOrder = order+1);
      this.add(sketch)
    }

    const hidingMaterial = new THREE.MeshBasicMaterial({transparent: true, opacity: 0.0});

    const hidingFrameLeft = new THREE.Mesh(new THREE.PlaneGeometry(0.4, order/5+1), hidingMaterial);
    hidingFrameLeft.renderOrder = order;
    hidingFrameLeft.position.set(-0.32, 0, 0.01);
    //hidingFrameLeft.position.z = 0.2;
    this.add(hidingFrameLeft);

    const hidingFrameRight = new THREE.Mesh(new THREE.PlaneGeometry(0.4, order/5+1), hidingMaterial);
    hidingFrameRight.renderOrder = order;
    hidingFrameRight.position.set(0.32, 0, 0.01);
    //hidingFrameRight.position.z = 0.2;
    this.add(hidingFrameRight);

    const hidingFrameTop = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), hidingMaterial);
    hidingFrameTop.renderOrder = order;
    hidingFrameTop.position.set(0, -0.62, 0.01);
    //hidingFrameTop.position.z = 0.2;
    this.add(hidingFrameTop);

    const hidingFrameBottom = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), hidingMaterial);
    hidingFrameBottom.renderOrder = order;
    hidingFrameBottom.position.set(0, 0.62, 0.01);
    //hidingFrameBottom.position.z = 0.2;
    this.add(hidingFrameBottom);

    this.sketchIndex = Random.int(0, this.sketches.length - 1);
  }

  updateImage(image) {
    const sketch = Random.pick(this.sketches);
    sketch.updateImage(image);
  }

  animate() {
    const sketch = this.sketches[this.sketchIndex];
    sketch.visible = true;
    sketch.animate();
    
    if (sketch.isDone()) {
      sketch.visible = false;
      sketch.rewind();
      
      this.sketchIndex = (this.sketchIndex + 1) % this.sketches.length;
      
      this.sketches[this.sketchIndex].visible = true;
      this.sketches[this.sketchIndex].rewind();
    }

    if (this.timeOffset != 0 && this.timer.get() > this.timeOffset) {
      sketch.rewind();
      this.timeOffset = 0;
      console.log("rewinding TV");
    }
  }
}

class SlideInFromSides extends THREE.Object3D {
  constructor(textureCollection) {
    super();

    this.timer = new Timer();

    const textureHead = textureCollection.getDefault();

    const materialHead1 = new THREE.MeshBasicMaterial({
      transparent: true,
      map: textureHead,
      side: THREE.DoubleSide,
    });

    const materialHead2 = new THREE.MeshBasicMaterial({
      transparent: true,
      map: textureHead,
      side: THREE.DoubleSide,
    });

    const textureBody1 = Random.pick(textureCollection.bodies.female);

    const materialBody1 = new THREE.MeshBasicMaterial({
      transparent: true,
      map: textureBody1,
      side: THREE.DoubleSide,
    });

    const textureBody2 = Random.pick(textureCollection.bodies.male);

    const materialBody2 = new THREE.MeshBasicMaterial({
      transparent: true,
      map: textureBody2,
      side: THREE.DoubleSide,
    });

    const face1 = new THREE.Mesh(new THREE.PlaneGeometry(0.15,0.15), materialHead1);
    face1.position.y += 0.1;
    face1.position.z -= 0.01;
    const body1 = new THREE.Mesh(new THREE.PlaneGeometry(0.4,0.4), materialBody1);
    const person1 = new THREE.Object3D();
    person1.add(face1);
    person1.add(body1);
    person1.position.y -= 0.1;

    const face2 = new THREE.Mesh(new THREE.PlaneGeometry(0.15,0.15), materialHead2);
    face2.position.y += 0.1;
    face2.position.z -= 0.01;
    const body2 = new THREE.Mesh(new THREE.PlaneGeometry(0.4,0.4), materialBody2);
    const person2 = new THREE.Object3D();
    person2.add(face2);
    person2.add(body2);
    person2.position.z -= 0.02;
    person2.position.y -= 0.1;
    person2.scale.multiplyScalar(1.33);

    const group = new THREE.Object3D();
    group.add(person1);
    group.add(person2);

    this.person1 = person1;
    this.person2 = person2;

    this.add(group);

    this.animationTime = 3;

    this.faceMaterials = [materialHead1, materialHead2];
  }

  animate() {
    const time = Math.min(this.timer.get()/this.animationTime, 1); // TODO: Some DRY with other sketches
    const easedTime = easeOutCubic(time);

    const person1From = new THREE.Vector3(-0.2, this.person1.position.y, this.person1.position.z);
    const person1To = new THREE.Vector3(-0.05, this.person1.position.y, this.person1.position.z);
    this.person1.position.copy(person1From.clone().lerp(person1To, easedTime));

    const person2From = new THREE.Vector3(0.2, this.person2.position.y, this.person2.position.z);
    const person2To = new THREE.Vector3(0.05, this.person2.position.y, this.person2.position.z);
    this.person2.position.copy(person2From.clone().lerp(person2To, easedTime));
  }

  isDone() {
    return this.timer.get() >= this.animationTime;
  }

  rewind() {
    this.timer.start();
    this.animate();
  }

  updateImage(image) {
    const material = Random.pick(this.faceMaterials);
    material.map = image;
    material.map.anisotropy = Math.pow(2, 3);
    //material.map.minFilter = THREE.LinearMipMapLinearFilter;
    material.needsUpdate = true;
  }
}

class ZoomOut extends THREE.Object3D {
  constructor(textureCollection) {
    super();

    this.timer = new Timer();

    const textureHead = textureCollection.getDefault();

    const materialHead = new THREE.MeshBasicMaterial({
      transparent: true,
      map: textureHead,
      side: THREE.DoubleSide,
    });

    const textureBody1 = Random.pick(textureCollection.bodies.female);

    const materialBody1 = new THREE.MeshBasicMaterial({
      transparent: true,
      map: textureBody1,
      side: THREE.DoubleSide,
    });

    const face1 = new THREE.Mesh(new THREE.PlaneGeometry(0.15,0.15), materialHead);
    face1.position.y += 0.1;
    face1.position.z -= 0.01;
    
    const body1 = new THREE.Mesh(new THREE.PlaneGeometry(0.4,0.4), materialBody1);

    // To zoom out from face:
    face1.position.y -= 0.1;
    body1.position.y -= 0.1;

    const person1 = new THREE.Object3D();
    person1.add(face1);
    person1.add(body1);

    const group = new THREE.Object3D();
    group.add(person1);

    this.person1 = person1;

    this.add(group);

    this.faceMaterial = materialHead;

    this.animationTime = Random.int(3, 8);
  }

  animate() {
    const time = Math.min(this.timer.get()/this.animationTime, 1);
    const easedTime = easeOutCubic(time);

    const zoomFrom = 3;
    const zoomTo = 1;

    const person1From = new THREE.Vector3(zoomFrom, zoomFrom, zoomFrom);
    const person1To = new THREE.Vector3(zoomTo, zoomTo, zoomTo);
    this.person1.scale.copy(person1From.clone().lerp(person1To, easedTime));
  }

  isDone() {
    return this.timer.get() >= this.animationTime;
  }

  rewind() {
    this.timer.start();
    this.animate();
  }

  updateImage(image) {
    const material = this.faceMaterial;
    material.map = image;
    material.map.anisotropy = Math.pow(2, 3);
    //material.map.minFilter = THREE.LinearMipMapLinearFilter;
    material.needsUpdate = true;
  }
}

//TODO: A lot of DRY with all other sketches
class Skip extends THREE.Object3D {
  constructor(textureCollection) {
    super();

    this.timer = new Timer();

    const textureHead = textureCollection.getDefault();

    const materialHead = new THREE.MeshBasicMaterial({
      transparent: true,
      map: textureHead,
      side: THREE.DoubleSide,
    });

    const textureBody1 = Random.pick(textureCollection.bodies.female);

    const materialBody1 = new THREE.MeshBasicMaterial({
      transparent: true,
      map: textureBody1,
      side: THREE.DoubleSide,
    });

    const face1 = new THREE.Mesh(new THREE.PlaneGeometry(0.15,0.15), materialHead);
    face1.position.y += 0.1;
    face1.position.z -= 0.01;
    
    const body1 = new THREE.Mesh(new THREE.PlaneGeometry(0.4,0.4), materialBody1);

    // To zoom out from face:
    face1.position.y -= 0.1;
    body1.position.y -= 0.1;

    const person1 = new THREE.Object3D();
    person1.add(face1);
    person1.add(body1);

    const group = new THREE.Object3D();
    group.add(person1);

    this.person1 = person1;

    this.add(group);

    this.faceMaterial = materialHead;

    this.animationTime = Random.int(3, 10);
  }

  animate() {
    const time = Math.min(this.timer.get()/this.animationTime, 0.999);

    const positions = [
      new THREE.Vector3(1, -0.25, 0),
      new THREE.Vector3(-1, -0.25, 0),
      new THREE.Vector3(0, -0.3, 0),
      new THREE.Vector3(1, -0.3, 0),
      new THREE.Vector3(0.5, -0.35, 0),
    ]
    const zooms = [1, 1.5, 2, 2.5, 3]

    const i = Math.floor(time * positions.length);

    this.person1.position.copy(positions[i]).multiplyScalar(0.07);
    this.person1.scale.copy(new THREE.Vector3(zooms[i], zooms[i], zooms[i]));
  }

  isDone() {
    return this.timer.get() >= this.animationTime;
  }

  rewind() {
    this.timer.start();
    this.animate();
  }

  updateImage(image) {
    const material = this.faceMaterial;
    material.map = image;
    material.map.anisotropy = Math.pow(2, 3);
    //material.map.minFilter = THREE.LinearMipMapLinearFilter;
    material.needsUpdate = true;
  }
}