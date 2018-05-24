import { ratio, Random } from './util.js';

export default class Manhattan {

    constructor(renderer, textureCollection) {

        const cameraHeight = 0;
        this._scene = new THREE.Scene();
        this._camera = new THREE.PerspectiveCamera(45, ratio(renderer), 0.1, 10000);
        this._camera.position.set(0, cameraHeight, 2.55);
        this._camera.updateProjectionMatrix();
        
        //addResizeListener(this._camera, renderer);

        this.skyscrapers = [];

        //this._scene.add(textureCollection);

                this.orbitControls = new THREE.OrbitControls(this._camera);
        this.orbitControls.target = new THREE.Vector3(0, cameraHeight, 0);
        this.orbitControls.update();

        for (let i = 0; i < 10; i++) {
            const manhattanMesh = new THREE.Mesh(
                new THREE.BoxGeometry(1, 10, 1),
                new THREE.MeshStandardMaterial()
            );
            manhattanMesh.position.set(10, 0, -5 - i * 4);
            this._scene.add(manhattanMesh);
            this.skyscrapers.push(manhattanMesh);
        }

        var lightManhattan = new THREE.DirectionalLight(0xffffff, 1.0);
        lightManhattan.position.set(-0.5, 1, 1).normalize();
        this._scene.add(lightManhattan);

        this.manhattanObject3D = new ManhattanObject3D(textureCollection);
        this.manhattanObject3D.position.set(-1, 0, -50)
        this._scene.add(this.manhattanObject3D);
    }

    get scene() {
        return this._scene;
    }

    get camera() {
        return this._camera;
    }

    animate() {
        const speed = 0.02;
        for (let skyscraper of this.skyscrapers) {
            skyscraper.position.z += speed;
            if (skyscraper.position.z > -5) {
                skyscraper.position.z = -50;
            }
        }
        this.orbitControls.update();
    }

    updateImage(image) {
        console.log("Updating texture " + !!image);

        const index = Random.int(0, 99)

        const plane = this.manhattanObject3D.children[index];

        plane.material.map = image;
        //plane.material.map.anisotropy = Math.pow(2, 3);
        //plane.material.map.minFilter = THREE.LinearMipMapLinearFilter;
        plane.material.needsUpdate = true;
    }
}


class ManhattanObject3D extends THREE.Object3D {
  constructor(textureCollection) {
    super();

    const texture = textureCollection.getDefault();

    for (let i = 0; i < textureCollection.nofTextures; i++) {
      let material = new THREE.MeshBasicMaterial({
        transparent: true,
        map: texture,
        side: THREE.DoubleSide,
      });
      //material = new THREE.MeshStandardMaterial();

      const plane = new THREE.Mesh(new THREE.PlaneGeometry(1,1), material);
      plane.texture = texture;

      plane.position.z = i/textureCollection.nofTextures * 100;
      
      this.add(plane);
    }
  }

  updatePositions() {
    const pathSpeed = 0.1;

    for (let plane of this.children) {
      if (plane.position.z > 10) plane.position.z = -10;
      plane.position.z += pathSpeed;
    }
  }
}