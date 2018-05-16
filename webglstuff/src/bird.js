import { createPlaneGeometry } from "./util.js";

class Bird extends THREE.Object3D {
  constructor() {
    super();

    this.rightBird = new HalfBird("right");
    this.leftBird = new HalfBird("left");

    this.add(this.rightBird);
    this.add(this.leftBird);

    this.position.y = 1;
  }

  flapWings(time) {
    this.rightBird.OLDflapWing(time);
    this.leftBird.OLDflapWing(time);
  }
}

class HalfBird extends THREE.Object3D {
  constructor(side) {
    super();

    function createLocalMaterial(filePath, offsetX, offsetY, scaleX, scaleY) {
      const localAlphaMap = new THREE.TextureLoader().load(filePath);
      localAlphaMap.needsUpdate = true;
      localAlphaMap.anisotropy = Math.pow(2, 3);

      if (side == "left") 
        localAlphaMap.repeat.x = -1;

      localAlphaMap.rotation = -Math.PI/2;
      
      localAlphaMap.center.set(0.5 + offsetX, 0.5 + offsetY);

      const localBumpMap = new THREE.TextureLoader().load("img/noise.png");
          
      const material = new THREE.MeshPhongMaterial({
        side: THREE.DoubleSide, flatShading: true, shininess: true, transparent: true,
        bumpMap: localBumpMap, bumpScale: 0.002,
        map: localAlphaMap,
      });

      return material;
    }

    const rightBodyGeometry = createPlaneGeometry(0.055, 0.4);
    const rightBodyMesh = new THREE.Mesh(rightBodyGeometry, 
      createLocalMaterial("img/birb2-"+side+"-body.png", 0, 0, 0.055, 0.4)
    );
    rightBodyMesh.position.x += 0.055/2;
    const rightBody = new THREE.Object3D().add(rightBodyMesh);

    const rightWingInnerGeometry = createPlaneGeometry(0.1, 0.25);
    const rightWingOuterGeometry = createPlaneGeometry(0.4, 0.4);
    const rightWingInnerMesh = new THREE.Mesh(rightWingInnerGeometry, 
      createLocalMaterial("img/birb2-"+side+"-inner-wing.png", 0, 0, 0.1, 0.25)
    );  
    const rightWingOuterMesh = new THREE.Mesh(rightWingOuterGeometry, 
      createLocalMaterial("img/birb2-"+side+"-outer-wing.png", 0, 0, 0.4, 0.4)
    );
    const rightWingInner = new THREE.Object3D().add(rightWingInnerMesh);
    const rightWingOuter = new THREE.Object3D().add(rightWingOuterMesh);
    rightWingInnerMesh.position.x = 0.1/2;
    rightWingOuterMesh.position.x = 0.4/2;
    rightWingOuter.position.x += 0.1;
    rightWingInner.position.z += (0.4-0.25)/2;
    const rightWing = new THREE.Object3D();
    rightWing.add(rightWingInner, rightWingOuter);
    rightWing.position.x += 0.055;

    const rightTailGeometry = createPlaneGeometry(0.1, 0.4-0.25);
    const rightTailMesh = new THREE.Mesh(rightTailGeometry, 
      createLocalMaterial("img/birb2-"+side+"-tail.png", 0, 0, 1, 1)
    );
    rightTailMesh.position.x += 0.1/2;
    rightTailMesh.position.z += (0.4-0.25)/2;
    const rightTail = new THREE.Object3D().add(rightTailMesh);
    rightTail.position.x += 0.055;
    rightTail.position.z -= 0.4/2; 

    this.rightWingInner = rightWingInner;
    this.rightWingOuter = rightWingOuter;
    this.rightWing = rightWing;

    this.add(rightWing);
    this.add(rightBody);
    this.add(rightTail);

    if (side == "left")
      this.scale.x = -1;
  }

  flapWing(time) {
    const speed = 4;
    const constantAngle = 0.15;
    const magicAmplitude = 0.4;
    const magicOffset = 0.0;
    const wingAmplitude = 0.7;
    const outerWingAmplitude = 0.2;
    const bobbingAmplitude = 0.01;

    const squareWave = Math.sin(time*speed + Math.PI/2 + magicOffset) > 0 ? 1 : 0;
    const magicWave = Math.sin(time*speed*2 - Math.PI/2 + magicOffset*2) - 1;

    const innerOuterAngle = 0.3;
    const innerOuterAngleDynamic = innerOuterAngle - squareWave*magicWave*magicAmplitude;
    
    this.rightWing.rotation.z = Math.sin(time*speed)*wingAmplitude + innerOuterAngleDynamic + constantAngle;

    this.rightWingOuter.rotation.z = - innerOuterAngleDynamic;

    this.position.y = -Math.sin(time*speed)*bobbingAmplitude;
  }

  OLDflapWing(time) {
    const speed = 6;
    const innerOuterAngle = 0.3;
    const constantAngle = 0.15;
    const magicOffset = 0.4;
    let wingAmplitude = 0.7;
    let outerWingAmplitude = 0.2;
    let bobbingAmplitude = 0.01;

    const sine = 1.0; //(Math.sin(time)+1)/2;
    wingAmplitude *= sine;
    outerWingAmplitude *= sine;
    bobbingAmplitude *= sine;
    
    this.rightWing.rotation.z = Math.sin(time*speed)*wingAmplitude + innerOuterAngle + constantAngle;
    
    const squareWave = Math.sin(time*speed + Math.PI/2 + magicOffset) > 0 ? 1 : 0;
    const magicWave = Math.sin(time*speed*2 - Math.PI/2 + magicOffset*2) - 1;

    this.rightWingOuter.rotation.z = magicWave*outerWingAmplitude*squareWave - innerOuterAngle;
    
    this.position.y = -Math.sin(time*speed)*bobbingAmplitude;
  }
}

export default Bird;