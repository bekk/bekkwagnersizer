import { ratio, Random, gridPosition2D, planeGeometry } from './util.js';

import fragmentShaderCode from './fragmentshader.glsl';
import fragmentShaderCodeFrame from './fragmentshaderframe.glsl';
import fragmentShaderCodeImage from './fragmentshaderimage.glsl';
import vertexShaderCode from './vertexshader.glsl';

const uniforms = {
    time: {value: 0},
};

export default class Manhattan {

    constructor(renderer, textureCollection) {
        const cameraHeight = 0;
        this._scene = new THREE.Scene();
        this._camera = new THREE.PerspectiveCamera(45, ratio(renderer), 0.1, 10000);
        this._camera.position.set(-3, cameraHeight, 2.55);
        this._camera.updateProjectionMatrix();

        this.skyscrapers = [];

        this.orbitControls = new THREE.OrbitControls(this._camera);
        this.orbitControls.target = new THREE.Vector3(0, cameraHeight - 5, -20);
        this.orbitControls.update();

        var lightManhattan = new THREE.DirectionalLight(0xffffff, 1.0);
        lightManhattan.position.set(-0.5, 1, 1).normalize();
        this._scene.add(lightManhattan);

        for (let i = 0; i < 4; i++) {
            const skyscraper = new ManhattanObject3D(textureCollection);
            skyscraper.position.set(10, -10, -25 - i*35)
            this._scene.add(skyscraper);
            this.skyscrapers.push(skyscraper);
        }
    }

    get scene() {
        return this._scene;
    }

    get camera() {
        return this._camera;
    }

    animate() {
        this.orbitControls.update();
        uniforms.time.value += 1/60;
    }

    updateImage(image) {
        console.log("Updating texture " + !!image);

        const index = Random.int(0, this.skyscrapers[0].imagePlanes.length - 1);

        for (let skyscraper of this.skyscrapers) {
            const plane = skyscraper.imagePlanes[index];
            plane.uforms.map.value = image;
            //plane.material.map.anisotropy = Math.pow(2, 3);
            //plane.material.map.minFilter = THREE.LinearMipMapLinearFilter;
            plane.material.needsUpdate = true;
        }

    }
}

function makeFloor(textureCollection, deviance, imagePlanes) {
    const floor = new THREE.Object3D();

    const texture = textureCollection.getDefault();

    const uniformsFrame = {
        time: uniforms.time,
        deviance: {value: deviance},
    }


    // TODO: Reuse!
    const shaderMaterial = new THREE.ShaderMaterial({
        uniforms: uniformsFrame,
        vertexShader: vertexShaderCode,
        fragmentShader: fragmentShaderCode,
        transparent: false,
    });

    const shaderMaterialFrame = new THREE.ShaderMaterial({
        uniforms: uniformsFrame,
        vertexShader: vertexShaderCode,
        fragmentShader: fragmentShaderCodeFrame,
        transparent: false,
    }); 

    for (let i = 0; i < 5*2; i++) {

        const imageUniforms = {
            time: uniforms.time,
            map: {type: "t", value: texture},
            deviance: {value: deviance},
        }

        const imageMaterial = new THREE.ShaderMaterial({
            uniforms: imageUniforms,
            vertexShader: vertexShaderCode,
            fragmentShader: fragmentShaderCodeImage,
            transparent: true,
            side: THREE.DoubleSide
        });

        let geometry;

        if (i < 5) {
          geometry = new THREE.PlaneGeometry(1,1);
        } else {
           geometry  = planeGeometry('XZ', 1, 1);
        }

        const plane = new THREE.Mesh(geometry, imageMaterial);
        plane.uforms = imageUniforms;
        plane.texture = texture;

        const spread = 10;

        floor.add(plane);
        if (imagePlanes) imagePlanes.push(plane);

        let frame; 

        if (i < 5) {
            frame = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 0.1), shaderMaterialFrame)
            plane.position.y = 0;
            plane.position.x = (i%5 - 5/2) / 5 * spread + 1;
            plane.position.z = 5.1;
        
            frame.position.copy(plane.position);
            frame.position.z -= 0.1;
        } else {
            frame = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1, 1), shaderMaterialFrame);
            plane.position.y = 0;
            plane.position.z = (i%5 - 5/2) / 5 * spread + 1;
            plane.position.x = -5.1;
        
            frame.position.copy(plane.position);
            frame.position.x -= -0.1;
        }

        floor.add(frame);
    }

    const walls = new THREE.Mesh(new THREE.BoxGeometry(10, 2, 10), shaderMaterial);

    floor.add(walls);

    return floor;
}

class ManhattanObject3D extends THREE.Object3D {
  constructor(textureCollection) {
    super();

    this._imagePlanes = [];

    const deviance = Random.float(0, 1);

    for (let j = 0; j < 30; j++) {
        const floor = makeFloor(textureCollection, deviance);
        floor.position.y = -3 + -j * 2;
        this.add(floor);
    }

    for (let j = 0; j < 10; j++) {
        const floor = makeFloor(textureCollection, deviance, this._imagePlanes);
        floor.position.y = j * 2;
        this.add(floor);
    }

    for (let j = 0; j < 30; j++) {
        const floor = makeFloor(textureCollection, deviance);
        floor.position.y = 21 + j * 2;
        this.add(floor);
    }
  }

  get imagePlanes() {
    return this._imagePlanes;
  }

  updatePositions() {
    
  }
}