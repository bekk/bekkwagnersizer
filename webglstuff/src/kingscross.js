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
  computeGeometry,
} from "./util.js";

import RealtimeTextureCollection from "./realtime-texture-collection.js";
import PlingPlongTransition from "./pling-plong-transition.js";

export class KingsCross {

    constructor(renderer, textureCollection) {
        this._camera = new THREE.PerspectiveCamera(45, ratio(renderer), 0.01, 10000);
        this._camera.position.set(0, 0.6, 0);
        //this._camera.position.set(-70, 100, 100);
        this._camera.updateProjectionMatrix();

        this.orbitControls = new THREE.OrbitControls(this._camera);
        this.orbitControls.target = new THREE.Vector3(-0.5, -0.9, -7);
        //this.orbitControls.target = new THREE.Vector3(0, 0, -120);
        this.orbitControls.update();

        this._camera.orbitControls = this.orbitControls;

        const rows = [];
        this.rows = rows;

        const scene = new THREE.Scene();
        this._scene = scene;

        const screenMaterials = [];
        const loader = new THREE.TextureLoader();
        for (let i = 0; i < 3; i++) {
          const texture = loader.load("http://localhost:3000/tv"+i+".png");
          const material = new THREE.MeshBasicMaterial({
            transparent: true,
            map: texture,
            side: THREE.DoubleSide,
          });
          screenMaterials.push(material);
        }

        function makeScreen(i, xCoord) {
          
          const mesh = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.1), screenMaterials[i % screenMaterials.length]);
          //mesh.scale.multiplyScalar(3.5);
          mesh.position.set(xCoord, 0.1, -i * i * 0.03)
          return mesh;
      }

        function makePeopleRow(xCoord, zCoord, reverseDir) {
          const row = new PeopleRow(textureCollection, reverseDir);
          scene.add(row);
          row.position.x = xCoord;
          row.position.z = zCoord;
          rows.push(row);
        }

        function makeBoxRow(xCoord, width, withScreens) {
          const length = 150;
          const height = 0.1;
          const row = new THREE.Mesh(new THREE.BoxGeometry(width, height, length), 
            new THREE.MeshStandardMaterial({
              emissive: new THREE.Color(0.5, 0.5, 0.0)
            }));
          scene.add(row);
          row.position.z = -length/2;
          row.position.x = xCoord;

          const group = new THREE.Object3D();

          group.add(row);

          const lineGeometry = new THREE.BoxGeometry(width*0.99, height, 1);

          const railingWhiteGeometry = new THREE.BoxGeometry(width*0.2, height, 0.325);
          const railingRedGeometry = new THREE.BoxGeometry(width*0.15, height, 0.27);

          const lineMaterial = new THREE.MeshBasicMaterial({
            color: new THREE.Color(0.5, 0.5, 0.0).multiplyScalar(0.85)
          });
          const redMaterial = new THREE.MeshBasicMaterial({
            color: new THREE.Color(1.0, 0.3, 0.5).multiplyScalar(0.85)
          });
          const whiteMaterial = new THREE.MeshStandardMaterial({
            color: new THREE.Color(1.0, 1.0, 1.0),
            emissive: new THREE.Color(0.5, 0.5, 0.5)
          });

          const lines = new THREE.Mesh(new THREE.Geometry, lineMaterial);
          const railingsRed = new THREE.Mesh(new THREE.Geometry, redMaterial)
          const railingsWhite = new THREE.Mesh(new THREE.Geometry, whiteMaterial)

          const rivetGeometry = new THREE.CylinderGeometry(1, 1, height, 10);
          
          for (let i = 0; i < length*3; i++) {
            const cutoff = length*0.8;
            //if (i > cutoff) break;

            const lineWidth = 0.001 + (i/length*3) * 0.03;

            const line = new THREE.Mesh(lineGeometry, lineMaterial);
            line.scale.z = lineWidth;

            line.position.set(xCoord, 0.002, -length*i/(length*3));
            
            lines.geometry.mergeMesh(line);

            for (let j = -1; j <= 1; j += 2) { 
              const railingWhite = new THREE.Mesh(railingWhiteGeometry, whiteMaterial);
              const railingRed = new THREE.Mesh(railingRedGeometry, redMaterial);

              railingWhite.position.copy(line.position);
              railingWhite.position.x += (width/2 - 0.01) * j;
              railingWhite.position.y += 0.03;
              railingRed.position.copy(line.position);
              railingRed.position.x += (width/2 - 0.01) * j;
              railingRed.position.y += 0.03 + 0.001;

              railingsWhite.geometry.mergeMesh(railingWhite);
              railingsRed.geometry.mergeMesh(railingRed);


              for (let k = -1; k <= 1; k+=2) {

                for (let l = -1; l <= 1; l+=2) {
                  const rivetSpread = 0.01;
                  const rivet = new THREE.Mesh(rivetGeometry, lineMaterial);
                  rivet.scale.x = 0.0025;
                  rivet.scale.z = 0.0025;

                  rivet.position.copy(railingWhite.position);
                  rivet.position.y += 0.002;
                  rivet.position.z += 0.15 * l;
                  rivet.position.x += k * rivetSpread;

                  lines.geometry.mergeMesh(rivet);
                }
              }
            }

            const rivetSpread = 0.035;

            for (let j = -2; j <= 2; j++) {
              const rivet = new THREE.Mesh(rivetGeometry, lineMaterial);
              rivet.scale.x = 0.003;
              rivet.scale.z = 0.003;

              rivet.position.copy(line.position);
              rivet.position.y += 0.001;
              rivet.position.z += 0.025 + lineWidth;
              rivet.position.x += j * rivetSpread;

              lines.geometry.mergeMesh(rivet);
            }

            if (withScreens && i < cutoff) group.add(makeScreen(i, xCoord))
          }

          group.add(lines);
          group.add(railingsWhite);
          group.add(railingsRed);

          group.position.y -= height/2

          scene.add(group)

        }

        makePeopleRow(-1.4, 0.5)
        makePeopleRow(-1.25, 0)

        makeBoxRow(-0.975, 0.3)

        makePeopleRow(-0.715, 0.2);
        makePeopleRow(-0.59, 0.15);
        makePeopleRow(-0.465, 0.1, true);

        makeBoxRow(-0.225, 0.25, true)

        makePeopleRow(0, 0) 

        makeBoxRow(0.225, 0.25, true)

        makePeopleRow(0.45, 0) 
        makePeopleRow(0.6, 0.5, true)

        makeBoxRow(0.925, 0.4)

        makePeopleRow(1.25, 0)
        makePeopleRow(1.4, 0.5)

        var light = new THREE.DirectionalLight(0xffffff, 0.7);
        light.position.set(3, 3, -1).normalize();
        this._scene.add(light);


        var light2 = new THREE.DirectionalLight(0xffffff, 0.7);
        light2.position.set(-3, 3, -1).normalize();
        this._scene.add(light2);

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

    updateImage(image, metadata) {
        console.log("Updating texture in KingsCross", !!image);

        const row = Random.pick(this.rows);
        row.updateImage(image, metadata)
    }

    updatePositions() {
      //const pathSpeed = 0.001;

      //for (let row of this.rows) {
      //  row.position.z += pathSpeed;
      //}
    }
}

class PeopleRow extends THREE.Object3D {
  constructor(textureCollection, reverseDir) {
    super();

    this.nofTextures = textureCollection.nofTextures;

    this.reverseDir = reverseDir;

    this.people = [];

    this.textureCollection = textureCollection;

    for (let i = 0; i < 100; i++) {
      const sex = Random.pick(["female", "male"]);
      const body = Random.pick(textureCollection.bodies[sex]);

      const texture = body.texture; 

      const material = new THREE.MeshBasicMaterial({
        transparent: true,
        map: texture,
        side: THREE.DoubleSide,
      });

      const geometry = new THREE.PlaneGeometry(1,1);

      let plane = new THREE.Mesh(geometry, material);
      plane.scale.multiplyScalar(0.75);
      plane.position.y -= 0.06;


      // TODO: Fix for too much transparent around body textures
      plane.scale.x *= 0.75;
      texture.repeat.set(0.75, 1);
      texture.offset.x = 0.125;

      
      const group = new THREE.Object3D();
      group.add(plane);

      const mal = body.metadata.mal;

      const textureHead = textureCollection.getDefault(sex, mal);

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

      this.spread = 2
      //const spreadIncrease = 0.001;
      //const spread = 0.02 + (i/4)*(i/4)*spreadIncrease;;

      group.normalizedPosition = i / 100;
      group.rotation.x = -0.2;

      const fakePlane = new THREE.Mesh(new THREE.PlaneGeometry(0.3,0.7), new THREE.MeshBasicMaterial({
          color: new THREE.Color(0xbc1a8d)
      }));
      fakePlane.position.z += 0.1;
      fakePlane.position.y -= 0.2;
      group.add(fakePlane)
      
      group.face = face;
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
      step.position.y = -0.35;
      group.add(step)

      group.step = step;

      this.add(group);
    }

    const floor = new THREE.Mesh(
      new THREE.BoxGeometry(0.75, 0.01, 100),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(0x00a5fe)
      })
    );
    floor.position.z = -50;
    floor.position.y = -0.2
    this.add(floor)
  }

  getZPos(normalizedPosition) {
    const maxDepth = 100 * this.spread;

    function easeOutLinearStepped(t) {
      const step1Limit = 0.35;
      const step2Limit = 0.8;

      const step1Value = 0.85;
      const step2Value = 0.97;

      if (t < step1Limit) {
        
        const relativeT = (t - 0)/(step1Limit - 0);
        return 0 + relativeT * (step1Value - 0);
      
      } else if (t < step2Limit) {
        
        const relativeT = (t - step1Limit)/(step2Limit - step1Limit);
        return step1Value + relativeT * (step2Value - step1Value);
      
      } else {
        
        const relativeT = (t - step2Limit)/(1 - step2Limit);
        return step2Value + relativeT * (1 - step2Value);
      
      };
    }

    const eased = easeOutLinearStepped(normalizedPosition);

    return -(1 - eased)*maxDepth;
  }

  animate() {
    let speed = 0.1/1000; // TODO make fps-independent

    for (let person of this.people) {

      person.position.z = this.getZPos(person.normalizedPosition)

      const dir = 1; //this.reverseDir ? -1 : 1;

      person.normalizedPosition += speed * dir;

      if (person.normalizedPosition > 1) {
        person.normalizedPosition = 0;
      }

      if (person.position.z < -11) {
        person.plane.visible = false;
        person.fakePlane.visible = true;
        person.step.visible = false;
      } else {
        person.plane.visible = true;
        person.fakePlane.visible = false;
        person.step.visible = true;
      }
    }

  }

  getIndexInBack() {
    const distanceIndeces = [];

    for (let i in this.people) {
      const person = this.people[i];
      distanceIndeces.push({index: i, distance: person.position.z});
    }

    distanceIndeces.sort(function(a, b) {
      return b.distance - a.distance; // REverse sort
    });

    return distanceIndeces[Random.int(20, 29)].index;
  }

  updateImage(image, metadata) {
    const index = this.getIndexInBack()

    const person = this.people[index];

    person.face.material.map = image;
    person.face.material.map.anisotropy = Math.pow(2, 3);
    //person.face.material.map.minFilter = THREE.LinearMipMapLinearFilter;
    person.face.material.needsUpdate = true;

    const body = this.textureCollection.getBody(metadata.sex, metadata.mal)
    person.plane.material.map = body;
    person.plane.material.map.anisotropy = Math.pow(2, 3);
    //person.plane.map.minFilter = THREE.LinearMipMapLinearFilter;
    person.plane.material.needsUpdate = true;
  }
}

export class Background extends THREE.Object3D {
  constructor() {
    super();
    const loader = new THREE.TextureLoader();
    const texture = loader.load("http://localhost:3000/kingscross.png");
    texture.minFilter = THREE.LinearFilter;

    const material = new THREE.MeshBasicMaterial({
      transparent: true,
      map: texture,
      side: THREE.DoubleSide,
    });

    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1.17, 0.576 + 0.02), material);
    mesh.scale.multiplyScalar(3.5);
    mesh.position.set(0.03, 0.22, 0)
    
    const group = new THREE.Object3D();
    group.add(mesh)

    this.add(group);
  }
}