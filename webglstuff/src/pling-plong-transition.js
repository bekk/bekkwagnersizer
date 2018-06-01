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
    const texture = loader.load("http://localhost:3000/internal/PlingPlong_KontrollPanel.png");
    texture.minFilter = THREE.LinearFilter;

    const materialKontrollPanel = new THREE.MeshBasicMaterial({
      transparent: true,
      map: texture,
      side: THREE.DoubleSide,
    });

    const skjermTexture = loader.load("http://localhost:3000/internal/PlingPlong_Skjerm.png");
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

    this.resetAnimation();

    group.add(skjerm)


    const armTexture = loader.load("http://localhost:3000/internal/PlingPlong_Arm.png");
    armTexture.minFilter = THREE.LinearFilter;
    const materialArm = new THREE.MeshBasicMaterial({
      transparent: true,
      map: armTexture,
      side: THREE.DoubleSide,
    });
    const arm = new THREE.Mesh(new THREE.PlaneGeometry(4.48, 3.06), materialArm);
    arm.scale.multiplyScalar(0.055);
    arm.position.set(
      -0.28,
      -0.52,
      kontrollPanel.position.z + 0.02
    );
    group.add(arm)


    const buttonTexture = loader.load("http://localhost:3000/internal/PlingPlong_Btn.png");
    buttonTexture.minFilter = THREE.LinearFilter;
    const materialButton = new THREE.MeshBasicMaterial({
      transparent: true,
      map: buttonTexture,
      side: THREE.DoubleSide,
    });
    const button = new THREE.Mesh(new THREE.PlaneGeometry(1.07, 1.42), materialButton);
    button.scale.multiplyScalar(0.04);
    button.position.set(
      -0.3,
      -0.22,
      kontrollPanel.position.z + 0.015
    );
    group.add(button)


    const handTexture = loader.load("http://localhost:3000/internal/PlingPlong_Hand.png");
    handTexture.minFilter = THREE.LinearFilter;
    const materialHand = new THREE.MeshBasicMaterial({
      transparent: true,
      map: handTexture,
      side: THREE.DoubleSide,
    });
    const hand = new THREE.Mesh(new THREE.PlaneGeometry(3.32, 4.18), materialHand);
    

    const fingerTexture = loader.load("http://localhost:3000/internal/PlingPlong_Finger-fixed.png");
    fingerTexture.minFilter = THREE.LinearFilter;
    const materialFinger = new THREE.MeshBasicMaterial({
      transparent: true,
      map: fingerTexture,
      side: THREE.DoubleSide,
    });
    const finger = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 3.5), materialFinger);
    finger.scale.multiplyScalar(0.9);
    finger.position.set(0, 0.5, 0);

    const fingerContainer = new THREE.Object3D();
    fingerContainer.add(finger);
    fingerContainer.position.set(0, 1.2, 0.1);

    const handAndFinger = new THREE.Object3D();
    handAndFinger.add(hand);
    handAndFinger.add(fingerContainer);
    handAndFinger.scale.multiplyScalar(0.055);
    handAndFinger.position.set(
      0,
      0.09,
      0,
    );

    const handAndFingerContainer = new THREE.Object3D();
    handAndFingerContainer.position.set(
      -0.24,
      -0.46,
      kontrollPanel.position.z + 0.01,
    );
    handAndFingerContainer.add(handAndFinger);

    this.handAndFingerContainer = handAndFingerContainer;
    this.fingerContainer = fingerContainer;

    group.add(handAndFingerContainer)
  }

  stopSwing() {
    this.swingSpeed = 0;
  }

  pressButton() {
    this.pressTime = 0;
    this.pressSpeed = 0.2;
  }

  releaseButton() {
    this.pressTime = 1;
    this.pressSpeed = -0.2;
  }

  resetAnimation() {
    this.swingTime = 0;
    this.pressTime = 0;
    this.pressSpeed = 0;
    this.swingSpeed = 0.003;
  }

  animate() {
    const pressAmount = 0.2;

    this.handAndFingerContainer.rotation.z = Math.sin(this.swingTime * 10) * 0.13;

    this.fingerContainer.scale.y = 1 - this.pressTime * pressAmount;

    this.pressTime += this.pressSpeed;
    if (this.pressTime > 1) this.releaseButton();
    this.pressTime = clamp(this.pressTime, 0, 1);

    this.swingTime += this.swingSpeed;
  }

  zoom(normalizedZoom) {

    this.camera.position.copy(new THREE.Vector3(
        0,
        0.021,
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