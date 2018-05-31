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
  clamp
} from "./util.js";

import RealtimeTextureCollection from "./realtime-texture-collection.js";
import fragmentShaderCode from './fragmentshaderimage.glsl';
import vertexShaderCode from './vertexshader-noop.glsl';

export default class Telly {

    // TODO: Opplegget for tilbakespoling virker error prone

    constructor(renderer, textureCollection) {
        const width = renderer.getContext().drawingBufferWidth;
        const height = renderer.getContext().drawingBufferHeight;
        const zoom = 1600;//1600;
        this._camera = new THREE.OrthographicCamera(width / -zoom, width / zoom, height / zoom, height / -zoom, 0.01, 1000);
        this._camera.position.set(1.1, 0.57, 100);
        this._camera.updateProjectionMatrix();

        this.orbitControls = new THREE.OrbitControls(this._camera);
        this.orbitControls.target = this._camera.position.clone().sub(new THREE.Vector3(0, 0, this._camera.position.z));
        this.orbitControls.update();

        this.camera.orbitControls = this.orbitControls;

        this._scene = new THREE.Scene();

        this.TVs = [];

        for (let x = 0; x < 10; x++) {
          for (let y = 0; y < 8; y++) {
            const i = this.TVs.length;
            const tv = new TV(textureCollection, i * 2 + 1);
            tv.position.x += 0.25*x;
            tv.position.y += 0.161*y;
            tv.position.z += 0.1*i;
            this._scene.add(tv);
            this.TVs.push(tv)
          }
        }

        const gridMaterial = new THREE.MeshBasicMaterial({
          map: new THREE.TextureLoader().load("http://localhost:3000/grid.png"),
          transparent: true,
        });
        for (let i = 0; i < 5; i++) {
          for (let j = -1; j < 3; j++) {
            const grid = new THREE.Mesh(new THREE.PlaneGeometry(0.51, 0.51*1.3), gridMaterial)
            grid.position.set(0.125 + 1.0/2*i, 0.24 + j*0.65, 20)
            grid.renderOrder = 1000;
            this._scene.add(grid);
          }
        }

        var lightSun = new THREE.DirectionalLight(0xffffff, 1.0);
        lightSun.position.set(-0.5, 4, 1).normalize();
        this._scene.add(lightSun);

        this.oldY = this._scene.position.y;

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

    zoomAmount(normalizedZoom) {
        const invertedNorm = 1 - normalizedZoom;

        const startZoom = 0.75;
        const endZoom = 1.0;
        this.camera.zoom = startZoom + normalizedZoom * (endZoom - startZoom);
        this.camera.updateProjectionMatrix();

        this._scene.position.y = this.oldY + invertedNorm * 0.15;
    }

    updateImage(image, metadata) {
        console.log("Updating texture in Telly " + !!image);

        for (let i = 0; i < 3; i++) {
          const tv = Random.pick(this.TVs);
          tv.updateImage(image, metadata);
        }

    }
}

class TV extends THREE.Object3D {
  constructor(textureCollection, order) {
    super();

    this.sketches = [
      new SlideInFromSides(textureCollection),
      new ZoomOut(textureCollection),
      new Skip(textureCollection),
      new SlideUpFromBottom(textureCollection),
    ];

    this.timeOffset = Random.float(0, 5);
    this.timer = new Timer();

    for (let sketch of this.sketches) {
      sketch.visible = false;
      sketch.traverse((child) => child.renderOrder = order+1);
      this.add(sketch)
    }

    const hidingMaterial = new THREE.MeshBasicMaterial({transparent: true, opacity: 0.0});

    const hidingFrameLeft = new THREE.Mesh(new THREE.PlaneGeometry(0.4, order/5+1), hidingMaterial);
    hidingFrameLeft.renderOrder = order;
    hidingFrameLeft.position.set(-0.32, 0, 0.04);
    this.add(hidingFrameLeft);

    const hidingFrameRight = new THREE.Mesh(new THREE.PlaneGeometry(0.4, order/5+1), hidingMaterial);
    hidingFrameRight.renderOrder = order;
    hidingFrameRight.position.set(0.32, 0, 0.04);
    this.add(hidingFrameRight);

    const hidingFrameTop = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), hidingMaterial);
    hidingFrameTop.renderOrder = order;
    hidingFrameTop.position.set(0, -0.58, 0.04);
    this.add(hidingFrameTop);

    const hidingFrameBottom = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), hidingMaterial);
    hidingFrameBottom.renderOrder = order;
    hidingFrameBottom.position.set(0, 0.58, 0.04);
    this.add(hidingFrameBottom);

    this.sketchIndex = Random.int(0, this.sketches.length - 1);
  }

  updateImage(image, metadata) {
    const nextSketch = this.sketches[this.nextSketchIndex()];
    nextSketch.updateImage(image, metadata);
  }

  nextSketchIndex() {
    return (this.sketchIndex + 1) % this.sketches.length;
  }

  animate() {
    const sketch = this.sketches[this.sketchIndex];
    sketch.visible = true;
    sketch.animate();
    
    if (sketch.isDone()) {
      sketch.visible = false;
      sketch.rewind();
      
      this.sketchIndex = this.nextSketchIndex();
      
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

    const sex1 = Random.pick(["male", "female"]);
    const textureHead1 = textureCollection.getDefault(sex1);

    const sex2 = Random.pick(["male", "female"]);
    const textureHead2 = textureCollection.getDefault(sex2);

    const materialHead1 = new THREE.MeshBasicMaterial({
      transparent: true,
      map: textureHead1,
      side: THREE.DoubleSide,
    });

    const materialHead2 = new THREE.MeshBasicMaterial({
      transparent: true,
      map: textureHead2,
      side: THREE.DoubleSide,
    });

    materialHead1.sex = sex1;
    materialHead2.sex = sex2;

    const body1 = Random.pick(textureCollection.bodies.male);
    const textureBody1 = body1.texture;

    const uniforms = {
        map: {type: "t", value: textureBody1},
    }

    const materialBody1 = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: vertexShaderCode,
        fragmentShader: fragmentShaderCode,
        transparent: true,
    });

    const body2 = Random.pick(textureCollection.bodies.male);
    const textureBody2 = body2.texture;

    const materialBody2 = new THREE.MeshBasicMaterial({
      transparent: true,
      map: textureBody2,
      side: THREE.DoubleSide,
    });

    const face1 = new THREE.Mesh(new THREE.PlaneGeometry(0.15,0.15), materialHead1);
    face1.position.y += 0.1;
    face1.position.z += 0.01;
    const bodyMesh1 = new THREE.Mesh(new THREE.PlaneGeometry(0.3,0.3), materialBody1);
    const person1 = new THREE.Object3D();
    person1.add(face1);
    person1.add(bodyMesh1);
    person1.position.y -= 0.07;
    person1.position.z -= 0.05;

    const face2 = new THREE.Mesh(new THREE.PlaneGeometry(0.15,0.15), materialHead2);
    face2.position.y += 0.1;
    face2.position.z += 0.01;
    const bodyMesh2 = new THREE.Mesh(new THREE.PlaneGeometry(0.3,0.3), materialBody2);
    const person2 = new THREE.Object3D();
    person2.add(face2);
    person2.add(bodyMesh2);
    person2.position.y -= 0.07;
    person2.scale.multiplyScalar(1.1);

    const group = new THREE.Object3D();
    group.add(person1);
    group.add(person2);

    this.person1 = person1;
    this.person2 = person2;

    this.add(group);

    this.animationTime = 3;
    this.hangTime = 15;

    const otherType = Random.bool(0.5);

    if (otherType) {
      person2.scale.set(1.1, 1.1, 1.1)
      person1.scale.multiplyScalar(2.5);
      person2.scale.multiplyScalar(2.5);
      person1.position.y = -0.32;
      person2.position.y = -0.33;
    }

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
    return this.timer.get() >= this.animationTime + this.hangTime;
  }

  rewind() {
    this.timer.start();
    this.animate();
  }

  updateImage(image, metadata) { // TODO: metadata
    const material = Random.pick(this.faceMaterials);
    material.map = image;
    material.map.anisotropy = Math.pow(2, 3);
    //material.map.minFilter = THREE.LinearMipMapLinearFilter;
    material.needsUpdate = true;
  }
}

class SlideUpFromBottom extends THREE.Object3D {
  constructor(textureCollection) {
    super();

    const nofPeople = Random.pick([1, 3]);

    this.timer = new Timer();

    this.persons = [];
    this.faceMaterials = [];

    for (let i = 0; i < nofPeople; i++) {
      const textureHead = textureCollection.getDefault();

      const materialHead = new THREE.MeshBasicMaterial({
        transparent: true,
        map: textureHead,
        side: THREE.DoubleSide,
      });

      const body = Random.pick(textureCollection.bodies.male);
      const textureBody = body.texture;

      const materialBody = new THREE.MeshBasicMaterial({
        transparent: true,
        map: textureBody,
        side: THREE.DoubleSide,
      });
      const face = new THREE.Mesh(new THREE.PlaneGeometry(0.15,0.15), materialHead);
      face.position.y += 0.1;
      face.position.z += 0.01;
      const bodyMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.3,0.3), materialBody);
      const person = new THREE.Object3D();
      person.add(face);
      person.add(bodyMesh);
      person.position.y -= 0.12;
      person.position.z -= 0.04 + i * 0.01;
      person.scale.multiplyScalar(1.25);
      const normalizedIndex = nofPeople != 1 
        ? (i - (nofPeople-1)/2) / ((nofPeople-1)/2)
        : Random.pick([-0.5, 0.5]);

      person.position.x = normalizedIndex * 0.075;
      person.startTime = nofPeople != 1 
        ? i/(nofPeople-1)
        : 0;
      person.deviance = Math.random();

      const group = new THREE.Object3D();
      group.add(person);

      this.persons.push(person);
      this.faceMaterials.push(materialHead);

      this.add(group);
    }

    this.animationTime = 3;
    this.hangTime = 15;
  }

  animate() {
    const spread = 0.6;
    const heightSpread = 0.05;
    const playTime = this.timer.get()/this.animationTime;

    for (let person of this.persons) {
      const time = clamp(playTime - person.startTime*spread, 0, 1);

      const easedTime = easeOutCubic(time);

      const personFrom = new THREE.Vector3(
        person.position.x, 
        -0.5 + person.deviance * heightSpread, 
        person.position.z
      );
      const personTo = new THREE.Vector3(
        person.position.x, 
        -0.15 + person.deviance * heightSpread, 
        person.position.z
      );
      person.position.copy(personFrom.clone().lerp(personTo, easedTime));
    }
  }

  isDone() {
    return this.timer.get() >= this.animationTime + this.hangTime;
  }

  rewind() {
    this.timer.start();
    this.animate();
  }

  updateImage(image, metadata) {
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

// TODO: Alle er male

    const body1 = Random.pick(textureCollection.bodies.male);
    const textureBody1 = body1.texture;

    const materialBody1 = new THREE.MeshBasicMaterial({
      transparent: true,
      map: textureBody1,
      side: THREE.DoubleSide,
    });

    const face1 = new THREE.Mesh(new THREE.PlaneGeometry(0.15,0.15), materialHead);
    face1.position.y += 0.1;
    face1.position.z += 0.01;
    
    const body1Mesh = new THREE.Mesh(new THREE.PlaneGeometry(0.3,0.3), materialBody1);

    // To zoom out from face:
    face1.position.y -= 0.1;
    body1Mesh.position.y -= 0.1;

    const person1 = new THREE.Object3D();
    person1.add(face1);
    person1.add(body1Mesh);
    person1.position.x = Random.pick([-0.05, 0.05])

    const group = new THREE.Object3D();
    group.add(person1);

    this.person1 = person1;

    this.add(group);

    this.faceMaterial = materialHead;

    this.animationTime = Random.int(3, 8);
    this.hangTime = 15;
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
    return this.timer.get() >= this.animationTime + this.hangTime;
  }

  rewind() {
    this.timer.start();
    this.animate();
  }

  updateImage(image, metadata) {
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

    const body1 = Random.pick(textureCollection.bodies.male);
    const textureBody1 = body1.texture;

    const materialBody1 = new THREE.MeshBasicMaterial({
      transparent: true,
      map: textureBody1,
      side: THREE.DoubleSide,
    });

    const face1 = new THREE.Mesh(new THREE.PlaneGeometry(0.15,0.15), materialHead);
    face1.position.y += 0.1;
    face1.position.z += 0.01;
    
    const body1Mesh = new THREE.Mesh(new THREE.PlaneGeometry(0.3,0.3), materialBody1);

    // To zoom out from face:
    face1.position.y -= 0.1;
    body1Mesh.position.y -= 0.1;

    const person1 = new THREE.Object3D();
    person1.add(face1);
    person1.add(body1Mesh);

    const group = new THREE.Object3D();
    group.add(person1);

    this.person1 = person1;

    this.add(group);

    this.faceMaterial = materialHead;

    this.animationTime = Random.int(3, 10);
    this.hangTime = 15;
  }

  animate() {
    const time = Math.min(this.timer.get()/this.animationTime, 0.999);

    const positions = [
      new THREE.Vector3(1, -0.25, 0),
      new THREE.Vector3(-1, -0.25, 0),
      new THREE.Vector3(0, -0.35, 0),
      new THREE.Vector3(1, -0.35, 0),
      new THREE.Vector3(0.5, -0.4, 0),
    ]
    const zooms = [1, 1.5, 2, 2.5, 3]

    const i = Math.floor(time * positions.length);

    this.person1.position.copy(positions[i]).multiplyScalar(0.07);
    this.person1.scale.copy(new THREE.Vector3(zooms[i], zooms[i], zooms[i]));
  }

  isDone() {
    return this.timer.get() >= this.animationTime + this.hangTime;
  }

  rewind() {
    this.timer.start();
    this.animate();
  }

  updateImage(image, metadata) {
    const material = this.faceMaterial;
    material.map = image;
    material.map.anisotropy = Math.pow(2, 3);
    //material.map.minFilter = THREE.LinearMipMapLinearFilter;
    material.needsUpdate = true;
  }
}