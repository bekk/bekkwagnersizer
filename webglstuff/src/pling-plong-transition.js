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
    const texture = loader.load("http://localhost:3000/internal/PlingPlong_KontrollPanel-smaller.png");
    texture.minFilter = THREE.LinearFilter;

    const materialKontrollPanel = new THREE.MeshBasicMaterial({
      transparent: true,
      map: texture,
      side: THREE.DoubleSide,
    });

    const skjermTexture = loader.load("http://localhost:3000/internal/PlingPlong_Skjerm-smaller.png");
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

    const pantsTexture = loader.load("http://localhost:3000/internal/PlingPlong_Pants.png");
    pantsTexture.minFilter = THREE.LinearMipMapLinearFilter;
    const materialPants = new THREE.MeshBasicMaterial({
      transparent: true,
      map: pantsTexture,
      side: THREE.DoubleSide,
    });
    const pants = new THREE.Mesh(new THREE.PlaneGeometry(7.47, 6.2), materialPants);
    pants.scale.multiplyScalar(0.05);
    pants.position.set(
      0.1,
      -0.45,
      kontrollPanel.position.z + 0.02
    );
    group.add(pants)

    const shoeTexture = loader.load("http://localhost:3000/internal/PlingPlong_Shoe.png");
    shoeTexture.minFilter = THREE.LinearMipMapLinearFilter;
    const materialShoe = new THREE.MeshBasicMaterial({
      transparent: true,
      map: shoeTexture,
      side: THREE.DoubleSide,
    });
    const shoe = new THREE.Mesh(new THREE.PlaneGeometry(7.47, 6.2), materialShoe);
    shoe.scale.multiplyScalar(0.05);
    shoe.position.set(-0.08, 0.1, 0);

    const shoeContainter = new THREE.Object3D();
    shoeContainter.position.set(
      -0.07,
      -0.53,
      kontrollPanel.position.z + 0.01
    );
    shoeContainter.add(shoe);
    group.add(shoeContainter)


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

    const buttonPressedTexture = loader.load("http://localhost:3000/internal/PlingPlong_Btn-pressed.png");
    buttonPressedTexture.minFilter = THREE.LinearFilter;
    const materialButtonPressed = new THREE.MeshBasicMaterial({
      transparent: true,
      map: buttonPressedTexture,
      side: THREE.DoubleSide,
    });
    const buttonPressed = new THREE.Mesh(new THREE.PlaneGeometry(1.07, 1.42), materialButtonPressed);
    buttonPressed.scale.multiplyScalar(0.04);
    buttonPressed.position.copy(button.position);
    group.add(buttonPressed)
    buttonPressed.visible = false;


    const handTexture = loader.load("http://localhost:3000/internal/PlingPlong_Hand.png");
    handTexture.minFilter = THREE.LinearMipMapLinearFilter;
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
    finger.rotation.z = -0.1;

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
    this.shoeContainter = shoeContainter;
    this.button = button;
    this.buttonPressed = buttonPressed;

    group.add(handAndFingerContainer)


    this.count = 0;
    this.onTop = false;
    this.callback = () => {};
    this.onButtonDownCallback = () => {};

    this.resetAnimation();
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


    this.buttonPressed.visible = false;
    this.button.visible = true;
  }

  onButtonTop(callback) {
    this.count = 0;
    this.onTop = false;
    this.callback = callback;
  }

  onButtonDown(callback) {
    this.onButtonDownCallback = callback;
  }

  animate() {
    const pressAmount = 0.2;

    this.shoeContainter.rotation.z = Math.sin(this.swingTime * 21 + 1.2) * 0.06;

    const fingerSwing = Math.sin(this.swingTime * 9);
    this.handAndFingerContainer.rotation.z = fingerSwing * 0.13 - 0.06;

    if (fingerSwing >= 0.99 && this.onTop == false) {
      this.count++;
      //console.log("COUTN", this.count)
      this.onTop = true;
      this.callback(this.count);
    } else if (fingerSwing < 0.99) {
      this.onTop = false;
    }

    this.fingerContainer.scale.y = 1 - this.pressTime * pressAmount;

    this.pressTime += this.pressSpeed;

    if (this.pressTime > 0.8) {
      this.buttonPressed.visible = true;
      this.button.visible = false;
    }

    if (this.pressTime > 1) {
      this.releaseButton();
      this.onButtonDownCallback();
    }
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