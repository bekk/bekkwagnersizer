import { createPlaneGeometry, 
  createTexture, 
  updateTexture, 
  gridPosition3D, 
  normalizedCoordinates, 
  normalize,
  Random,
  ratio, 
  addResizeListener,
  clamp,
} from "./util.js";

export default class PlingPlongTransition extends THREE.Object3D {
  constructor(camera) {
    super();

    this.camera = camera;

    const loader = new THREE.TextureLoader();
    const texture = loader.load("http://localhost:3000/PlingPlong_KontrollPanel.png");
    texture.minFilter = THREE.LinearFilter;

    const materialKontrollPanel = new THREE.MeshBasicMaterial({
      transparent: true,
      map: loader.load("http://localhost:3000/PlingPlong_KontrollPanel.png"),
      side: THREE.DoubleSide,
    });

    const skjermTexture = loader.load("http://localhost:3000/PlingPlong_Skjerm.png");
    skjermTexture.minFilter = THREE.LinearFilter;

    const materialSkjerm = new THREE.MeshBasicMaterial({
      transparent: true,
      map: skjermTexture,
      side: THREE.DoubleSide,
    });

    const kontrollPanel = new THREE.Mesh(new THREE.PlaneGeometry(3.1, 1.0), materialKontrollPanel);
    kontrollPanel.scale.multiplyScalar(0.5);
    kontrollPanel.position.y = -0.35;
    kontrollPanel.position.z = 0.3;

    const skjerm = new THREE.Mesh(new THREE.PlaneGeometry(4, 2.2), materialSkjerm);
    skjerm.scale.multiplyScalar(0.7);
    
    const group = new THREE.Object3D();
    group.add(kontrollPanel)
    group.add(skjerm)

    this.add(group);

    this.group = group;

    this.oldY = this.camera.position.y;

    this.time = 0;
  }

  animate(normalizedZoom) {

    this.camera.position.copy(new THREE.Vector3(
        0,
        -0.0,
        1.8,
      ).lerp(
      new THREE.Vector3(
        0,
        0.34,
        0.8,
      ),
      normalizedZoom
    ))
  }
}