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
        this._scene = new THREE.Scene();
        this._camera = new THREE.PerspectiveCamera(90, ratio(renderer), 0.1, 10000);
        this._camera.position.set(0, 3, -15);
        this._camera.updateProjectionMatrix();

        this.skyscrapers = [];

        this.orbitControls = new THREE.OrbitControls(this._camera);
        this.orbitControls.target = this._camera.position.clone().add(new THREE.Vector3(0, -5, -20));
        this.orbitControls.update();

        var lightManhattan = new THREE.DirectionalLight(0xffffff, 1.0);
        lightManhattan.position.set(-0.5, 1, 1).normalize();
        this._scene.add(lightManhattan);

        const levels = 6;

        let flippy = 1;
        for (let i = 0; i < levels*2; i++) {
            const skyscraper = new ManhattanObject3D(textureCollection, flippy);
            const level = Math.floor(i/2);
            skyscraper.position.set(20 * flippy * THREE.Math.lerp(1, 0.25, level/levels), -10, -25 - level*15)
            this._scene.add(skyscraper);
            this.skyscrapers.push(skyscraper);
            flippy *= -1;
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
            plane.uforms.map.minFilter = THREE.LinearMipMapLinearFilter;
            plane.material.needsUpdate = true;
        }

    }
}

class ManhattanObject3D extends THREE.Object3D {
  constructor(textureCollection, flippy) {
    super();

    this._imagePlanes = [];

    const deviance = Random.float(0, 1);

    const uniformsFrame = {
        time: uniforms.time,
        deviance: {value: deviance},
    }

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

    const frameGeometry1 = new THREE.BoxGeometry(1, 1, 0.1);
    const frameGeometry2 = new THREE.BoxGeometry(0.1, 1, 1);
    const planeGeometry1 = new THREE.PlaneGeometry(1,1);
    const planeGeometry2 = planeGeometry('XZ', 1, 1);

    const defaultTexture = textureCollection.getDefault();

    const defaultImageUniforms = {
        time: uniforms.time,
        map: {type: "t", value: defaultTexture},
        deviance: {value: deviance},
    }

    const defaultImageMaterial = new THREE.ShaderMaterial({
        uniforms: defaultImageUniforms,
        vertexShader: vertexShaderCode,
        fragmentShader: fragmentShaderCodeImage,
        transparent: true,
        side: THREE.DoubleSide
    });

    const wallGeometry = new THREE.BoxGeometry(10, 2, 10);

    function makeFloor(textureCollection, deviance, imagePlanes) {
        const floor = new THREE.Object3D();

        for (let i = 0; i < 5*2; i++) {

            const imageUniforms = {
                time: uniforms.time,
                map: {type: "t", value: defaultTexture},
                deviance: {value: deviance},
            }

            let imageMaterial;
            if (imagePlanes) {
                imageMaterial = new THREE.ShaderMaterial({
                    uniforms: imageUniforms,
                    vertexShader: vertexShaderCode,
                    fragmentShader: fragmentShaderCodeImage,
                    transparent: true,
                    side: THREE.DoubleSide
                });
            } else {
                imageMaterial = defaultImageMaterial;
            }

            let geometry;

            if (i < 5) {
              geometry = planeGeometry1;
            } else {
               geometry  = planeGeometry2;
            }

            const plane = new THREE.Mesh(geometry, imageMaterial);
            plane.uforms = imageUniforms;
            plane.texture = defaultTexture;

            const spread = 10;

            floor.add(plane);
            if (imagePlanes) imagePlanes.push(plane);

            let frame; 

            if (i < 5) {
                frame = new THREE.Mesh(frameGeometry1, shaderMaterialFrame)
                plane.position.y = 0;
                plane.position.x = (i%5 - 5/2) / 5 * spread + 1;
                plane.position.z = 5.1;
            
                frame.position.copy(plane.position);
                frame.position.z -= 0.1;
            } else {
                frame = new THREE.Mesh(frameGeometry2, shaderMaterialFrame);
                plane.position.y = 0;
                plane.position.z = (i%5 - 5/2) / 5 * spread + 1
                plane.position.x = -5.1 * flippy;
            
                frame.position.copy(plane.position);
                frame.position.x -= -0.1 * flippy;
            }

            floor.add(frame);
        }

        const walls = new THREE.Mesh(wallGeometry, shaderMaterial);

        floor.add(walls);

        return floor;
    }

    for (let j = 0; j < 40; j++) {
        const floor = makeFloor(textureCollection, deviance);
        floor.position.y = -3 + -j * 2;
        this.add(floor);
    }

    for (let j = 0; j < 10; j++) {
        const floor = makeFloor(textureCollection, deviance, this._imagePlanes);
        floor.position.y = j * 2;
        this.add(floor);
    }

    for (let j = 0; j < 20; j++) {
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