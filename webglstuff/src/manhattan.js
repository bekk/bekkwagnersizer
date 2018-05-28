import { ratio, Random, gridPosition2D, planeBufferGeometry } from './util.js';

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

        const levels = 8;

        let flippy = 1;
        for (let i = 0; i < levels*2; i++) {
            const level = Math.floor(i/2);
            const position = new THREE.Vector3(
                15 * flippy * THREE.Math.lerp(1, 0.2, level/levels), 
                -10, 
                -25 - level*15 + 2*flippy
            );
            const nearCamera = Math.abs(position.z) < 125;
            const angleToCamera = Math.abs(position.z) < 75;  
            const skyscraper = new ManhattanObject3D(textureCollection, flippy, nearCamera, angleToCamera);
            skyscraper.position.copy(position);
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
        uniforms.time.value += 1/60; // TODO: Measure time properly
    }

    updateImage(image) {
        console.log("Updating texture in Manhattan " + !!image);

        const index = Random.int(0, this.skyscrapers[0].imagePlanes.length - 1);

        for (let skyscraper of this.skyscrapers) {
            if (!skyscraper.imagePlanes[index]) continue;
            const plane = skyscraper.imagePlanes[index];
            plane.uforms.map.value = image;
            //plane.material.map.anisotropy = Math.pow(2, 3);
            plane.uforms.map.minFilter = THREE.LinearMipMapLinearFilter;
            plane.material.needsUpdate = true;
        }

    }
}

class ManhattanObject3D extends THREE.Object3D {
  constructor(textureCollection, flippy, nearCamera, angleToCamera) {
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

    const allFramesMesh = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.5, 0.1), shaderMaterialFrame); // TODO: Initialize wihtout geometry?
    const allWallsMesh = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.5, 0.1), shaderMaterial);
    const allLinesMesh = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.5, 0.1), shaderMaterialFrame);

    const frameGeometry1 = nearCamera ? 
        new THREE.BoxGeometry(1.5, 1.5, 0.1):
        new THREE.PlaneGeometry(1.5, 1.5);
    const frameGeometry2 = new THREE.BoxGeometry(0.1, 1.5, 1.5);

    const planeGeometry1 = new THREE.PlaneBufferGeometry(1.5, 1.5);
    const planeGeometry2 = planeBufferGeometry('XZ', 1.5, 1.5);

    const defaultTexture = textureCollection.getBald();

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

    const shouldersImageUniforms = {
        time: uniforms.time,
        map: {type: "t", value: textureCollection.getShoulders()},
        deviance: {value: deviance},
    }

    const shouldersImageMaterial = new THREE.ShaderMaterial({
        uniforms: shouldersImageUniforms,
        vertexShader: vertexShaderCode,
        fragmentShader: fragmentShaderCodeImage,
        transparent: true,
        side: THREE.DoubleSide
    });

    const wallGeometry = new THREE.BoxGeometry(10, 3, 10);

    function makeFloor(textureCollection, deviance, height, imagePlanes) {
        const floor = new THREE.Object3D();

        const nofWindows = 4;

        for (let i = 0; i < nofWindows*2; i++) {

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

            if (i < nofWindows) {
              geometry = planeGeometry1;
            } else {
               geometry  = planeGeometry2;
            }

            const plane = new THREE.Mesh(geometry, imageMaterial);
            plane.uforms = imageUniforms;
            plane.texture = defaultTexture;

            const spread = 10;

            const includePlane = angleToCamera || (nearCamera && i < nofWindows);

            if (includePlane) floor.add(plane);
            if (includePlane && imagePlanes) imagePlanes.push(plane);

            let frame; 

            if (i < nofWindows) {
                frame = new THREE.Mesh(frameGeometry1, shaderMaterialFrame)
                plane.position.y = 0;
                plane.position.x = (i%nofWindows - nofWindows/2) / nofWindows * spread + 1;
                plane.position.z = (5 + 0.11);
            
                frame.position.copy(plane.position);
                frame.position.z -= 0.1;
            } else {
                frame = new THREE.Mesh(frameGeometry2, shaderMaterialFrame);
                plane.position.y = 0;
                plane.position.z = (i%nofWindows - nofWindows/2) / nofWindows * spread + 1
                plane.position.x = (-5 - 0.11) * flippy;
            
                frame.position.copy(plane.position);
                frame.position.x -= -0.1 * flippy;
            }

            const shoulders = plane.clone();
            shoulders.scale.y = 0.3;
            if (i < nofWindows) shoulders.position.z -= 0.02; else shoulders.position.x += 0.02*flippy
            shoulders.position.y -= 0.4;
            shoulders.material = shouldersImageMaterial;
            if (includePlane) floor.add(shoulders)

            frame.position.y = height;
            allFramesMesh.geometry.mergeMesh(frame);
        }

        const walls = new THREE.Mesh(wallGeometry, shaderMaterial);
        walls.position.y = height;
        allWallsMesh.geometry.mergeMesh(walls);

        //floor.add(walls);

        const line1 = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 3), shaderMaterialFrame);
        line1.position.set(-5, 0, -5);
        line1.position.y = height;
        allLinesMesh.geometry.mergeMesh(line1);

        const line2 = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 3), shaderMaterialFrame);
        line2.position.set(5, 0, -5);
        line2.position.y = height;
        allLinesMesh.geometry.mergeMesh(line2);

        const line3 = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 3), shaderMaterialFrame);
        line3.position.set(5, 0, 5);
        line3.position.y = height;
        allLinesMesh.geometry.mergeMesh(line3);

        const line4 = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 3), shaderMaterialFrame); // TODO: Try making all geometries buffergeometry
        line4.position.set(-5, 0, 5);
        line4.position.y = height;
        allLinesMesh.geometry.mergeMesh(line4);

        return floor;
    }

    const distribution = [20, 10, 60]

    for (let j = 0; j < distribution[0]; j++) {
        const height = distribution[1]*3 + 0.5 + j * 3;
        const floor = makeFloor(textureCollection, deviance, height); // TODO: Separate out makeFrame (with one geometry)
        floor.position.y = height;
        this.add(floor);
    }

    for (let j = 0; j < distribution[1]; j++) {
        const height = j * 3;
        const floor = makeFloor(textureCollection, deviance, height, this._imagePlanes);
        floor.position.y = height;
        this.add(floor);
    }

    for (let j = 0; j < distribution[2]; j++) {
        const height = -3 - 0.5 + -j * 3;
        const floor = makeFloor(textureCollection, deviance, height);
        floor.position.y = height;
        this.add(floor);
    }

    this.add(allFramesMesh);
    this.add(allWallsMesh);
    this.add(allLinesMesh);
  }

  get imagePlanes() {
    return this._imagePlanes;
  }

  updatePositions() {
    
  }
}