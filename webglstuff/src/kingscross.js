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
  clamp,
} from "./util.js";

import RealtimeTextureCollection from "./realtime-texture-collection.js";
import PlingPlongTransition from "./pling-plong-transition.js";

export default class KingsCross {

    constructor(renderer, textureCollection) {
        this._camera = new THREE.PerspectiveCamera(45, ratio(renderer), 0.01, 10000);
        this._camera.position.set(0, 0.8, 0);
        this._camera.updateProjectionMatrix();

        this.orbitControls = new THREE.OrbitControls(this._camera);
        this.orbitControls.target = new THREE.Vector3(-0.5, -0.5, -7);
        this.orbitControls.update();

        this._camera.orbitControls = this.orbitControls;

        const rows = [];
        this.rows = rows;

        const scene = new THREE.Scene();
        this._scene = scene;

        function makePeopleRow(xCoord) {
          const row = new PeopleRow(textureCollection);
          scene.add(row);
          row.position.x = xCoord;
          row.position.z = Math.random();
          rows.push(row);
        }

        function makeBoxRow(xCoord, width) {
          const length = 50;
          const row = new THREE.Mesh(new THREE.BoxGeometry(width, 0.1, length), 
            new THREE.MeshStandardMaterial({
              emissive: new THREE.Color(0.5, 0.5, 0.0)
            }));
          scene.add(row);
          row.position.z = -length/2;
          row.position.x = xCoord;
          
          for (let i = 0; i < length*3; i++) {
            const line = new THREE.Mesh(
              new THREE.BoxGeometry(width*0.99, 0.1, 0.01),
              new THREE.MeshBasicMaterial({
                color: new THREE.Color(0.5, 0.5, 0.0).multiplyScalar(0.85)
              })
            );
            line.position.set(xCoord, 0.002, -length*i/(length*3));
            scene.add(line)
          }

        }

        makePeopleRow(-1.4)
        makePeopleRow(-1.25)

        makeBoxRow(-1.0, 0.3)

        makePeopleRow(-0.75)
        makePeopleRow(-0.6)
        makePeopleRow(-0.45)

        makeBoxRow(-0.225, 0.25)

        makePeopleRow(0) 

        makeBoxRow(0.225, 0.25)

        makePeopleRow(0.45) 
        makePeopleRow(0.6)

        makeBoxRow(0.9, 0.4)

        makePeopleRow(1.25)
        makePeopleRow(1.4)

        scene.add(new Background(this._camera));

        var light = new THREE.DirectionalLight(0xffffff, 1.0);
        light.position.set(1, 3, -1).normalize();
        this._scene.add(light);

        addResizeListener(this._camera, renderer);
    }

    get scene() {
        return this._scene;
    }

    get camera() {
        return this._camera;
    }

    animate() {
        //this.updatePositions();
        for (let row of this.rows) {
          row.animate();
        }

        this.orbitControls.update();
    }

    zoomAmount(normalizedZoom) {
        
    }

    getIndexInBack(sex) {
        
    }

    updateImage(image, sex) {
        console.log("Updating texture in People", !!image, sex);

    }

    updatePositions() {
      //const pathSpeed = 0.001;

      //for (let row of this.rows) {
      //  row.position.z += pathSpeed;
      //}
    }
}

class PeopleRow extends THREE.Object3D {
  constructor(textureCollection) {
    super();

    this.nofTextures = textureCollection.nofTextures;

    this.people = [];

    for (let i = 0; i < 100; i++) {
      const sex = Random.pick(["female", "male"]);
      const textureBody = Random.pick(textureCollection.bodies[sex]);

      const material = new THREE.MeshBasicMaterial({
        transparent: true,
        map: textureBody,
        side: THREE.DoubleSide,
      });

      let plane = new THREE.Mesh(new THREE.PlaneGeometry(1,1), material);
      plane.scale.multiplyScalar(0.75);
      plane.position.y -= 0.06;

      //plane.renderOrder = 1;
      
      const group = new THREE.Object3D();
      group.add(plane);

      const textureHead = textureCollection.getDefault(sex);

      const materialHead = new THREE.MeshBasicMaterial({
        transparent: true,
        map: textureHead,
        side: THREE.DoubleSide,
        polygonOffset: true,
        polygonOffsetFactor: -100, // integer
        polygonOffsetUnits: 100 // integer
      });

      const face = new THREE.Mesh(new THREE.PlaneGeometry(0.4,0.4), materialHead);
      face.position.y += 0.18
      face.position.z += 0.04;
      //face.renderOrder = 1;
      group.material = materialHead;
      group.add(face)

      group.scale.multiplyScalar(0.5);

      const spread = 0.3
      //const spreadIncrease = 0.001;
      //const spread = 0.02 + (i/4)*(i/4)*spreadIncrease;;

      group.position.z = -i*spread
      group.rotation.x = -0.2;

      const fakePlane = new THREE.Mesh(new THREE.PlaneGeometry(0.3,0.7), new THREE.MeshBasicMaterial({
          color: new THREE.Color(0xbc1a8d)
      }));
      fakePlane.position.z += 0.1;
      fakePlane.position.y -= 0.2;
      group.add(fakePlane)
      
      group.plane = plane;
      group.fakePlane = fakePlane;
      this.people.push(group)

      group.sex = sex;

      const step = new THREE.Mesh(
        new THREE.PlaneGeometry(0.5, 0.03),
        new THREE.MeshBasicMaterial({
          color: new THREE.Color(0x000000)
        })
      );
      step.rotation.x = -Math.PI/2;
      step.position.y = -0.45;
      group.add(step)

      this.add(group);
    }

    const floor = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.01, 100),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(0x00a5fe)
      })
    );
    floor.position.z = -50;
    floor.position.y = -0.25
    this.add(floor)
  }

  animate() {
    let speed = 50/1000; // TODO make fps-independent
    
    for (let person of this.people) {
      person.position.z += speed

      if (person.position.z > 0) {
        person.position.z = -100*0.3;
      }

      if (person.position.z < (-100*0.3) * 0.4) {
        person.plane.visible = false;
        person.fakePlane.visible = true;
      } else {
        person.plane.visible = true;
        person.fakePlane.visible = false;
      }
    }
  }
}

class Background extends THREE.Object3D {
  constructor(camera) {
    super();
    const loader = new THREE.TextureLoader();
    const texture = loader.load("http://localhost:3000/kingscross.png");
    texture.minFilter = THREE.LinearFilter;

    const material = new THREE.MeshBasicMaterial({
      transparent: true,
      map: texture,
      side: THREE.DoubleSide,
    });

    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1.17, 0.57), material);
    mesh.scale.multiplyScalar(150);
    //mesh.position.copy(camera.orbitControls.target)
    mesh.position.set(-10, -18, -100)
    mesh.lookAt(camera.position);
    
    const group = new THREE.Object3D();
    group.add(mesh)

    this.add(group);
  }
}