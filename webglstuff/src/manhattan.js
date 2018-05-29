import { ratio, Random, gridPosition2D, planeBufferGeometry, computeGeometry } from './util.js';

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
        this._camera.position.set(0, 6, -15);
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
            const nearCamera = Math.abs(position.z) < 100;
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
            plane.uforms.map.anisotropy = Math.pow(2, 3);
            plane.uforms.map.minFilter = THREE.LinearMipMapLinearFilter;
            plane.material.needsUpdate = true;
        }

    }
}

class ManhattanObject3D extends THREE.Object3D {
  constructor(textureCollection, flippy, nearCamera, angleToCamera) {
    super();

    this._imagePlanes = [];

    const wallPalette = [
        new THREE.Color(0xe423bc),
        new THREE.Color(0xfffe47),
        new THREE.Color(0xf9d1ae),
        new THREE.Color(0x02e8ff),
        new THREE.Color(0x05d17c),
        new THREE.Color(0xefefef),
    ];

    for (let color of wallPalette) color.addScalar(0.1)

    const deviance = Random.float(0, 1);

    const uniformsWalls = {
        time: uniforms.time,
        deviance: {value: deviance},
        color: {value: Random.pick(wallPalette)},
    }

    const uniformsFrame = {
        time: uniforms.time,
        deviance: {value: deviance},
        //color: {value: new THREE.Color(0x5600eb)},
        color: {value: uniformsWalls.color.value.clone().multiplyScalar(0.8)},
    }

    const uniformsLine = {
        time: uniforms.time,
        deviance: {value: deviance},
        color: {value: uniformsWalls.color.value.clone().multiplyScalar(0.4)},
    }

    const shaderMaterial = new THREE.ShaderMaterial({
        uniforms: uniformsWalls,
        vertexShader: vertexShaderCode,
        fragmentShader: fragmentShaderCode,
        transparent: false,
    });

    const shaderMaterialFrame = new THREE.ShaderMaterial({
        uniforms: uniformsFrame,
        vertexShader: vertexShaderCode,
        fragmentShader: fragmentShaderCodeFrame,
        transparent: false,
        side: THREE.DoubleSide,
    }); 

    const shaderMaterialLine = new THREE.ShaderMaterial({
        uniforms: uniformsLine,
        vertexShader: vertexShaderCode,
        fragmentShader: fragmentShaderCodeFrame,
        transparent: false,
        side: THREE.DoubleSide,
    }); 

    const allFramesMesh = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.5, 0.1), shaderMaterialLine); // TODO: Initialize wihtout geometry?
    const allFrameBacksMesh = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.5, 0.1), shaderMaterialFrame);
    const allWallsMesh = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.5, 0.1), shaderMaterial);
    const allLinesMesh = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.5, 0.1), shaderMaterialLine);

    const framebox1 = new THREE.BoxGeometry(1.5, 1.5, 0.1);
    delete framebox1.faces.splice(8, 2);
    delete framebox1.faces.splice(8, 2);
    computeGeometry(framebox1);

    const framebox2 = new THREE.BoxGeometry(0.1, 1.5, 1.5);
    delete framebox2.faces.splice(0, 2);
    delete framebox2.faces.splice(0, 2);
    computeGeometry(framebox2);

    const frameGeometry1 = framebox1;
    const frameGeometry2 = framebox2;
    const frameBackGeometry1 = new THREE.PlaneGeometry(1.5, 1.5);
    const frameBackGeometry2 = planeBufferGeometry('XZ', 1.5, 1.5);

    const planeGeometry1 = new THREE.PlaneBufferGeometry(1.5, 1.5);
    const planeGeometry2 = planeBufferGeometry('XZ', 1.5, 1.5);

    const defaultTexture = textureCollection.getBald();
    defaultTexture.anisotropy = Math.pow(2, 3);

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
        side: THREE.DoubleSide,
    });

    const wallGeometry = new THREE.BoxGeometry(10, 3, 10);
    delete wallGeometry.faces.splice(4, 4);
    delete wallGeometry.faces.splice(6, 2);
    computeGeometry(wallGeometry);

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
                    side: THREE.DoubleSide,
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
                frame = new THREE.Mesh(frameGeometry1, shaderMaterialLine)
                plane.position.y = 0;
                plane.position.x = (i%nofWindows - nofWindows/2) / nofWindows * spread + 1.25;
                plane.position.z = (5 + 0.2);
            
                frame.position.copy(plane.position);
                frame.position.z -= 0.1;
            } else {
                frame = new THREE.Mesh(frameGeometry2, shaderMaterialLine);
                plane.position.y = 0;
                plane.position.z = (i%nofWindows - nofWindows/2) / nofWindows * spread + 1.25
                plane.position.x = (-5 - 0.2) * flippy;
            
                frame.position.copy(plane.position);
                frame.position.x -= -0.1 * flippy;
            }

            const shoulders = plane.clone();
            shoulders.scale.y = 0.3;
            if (i < nofWindows) shoulders.position.z -= 0.025; else shoulders.position.x += 0.025*flippy
            shoulders.position.y -= 0.4;
            shoulders.material = shouldersImageMaterial;
            if (includePlane) floor.add(shoulders)

            frame.position.y = height;
            if (nearCamera) allFramesMesh.geometry.mergeMesh(frame);

            const frameBackGeometry = i < nofWindows ? frameBackGeometry1 : frameBackGeometry2;
            const frameBack = new THREE.Mesh(frameBackGeometry, shaderMaterialFrame);
            frameBack.position.copy(frame.position);
            allFrameBacksMesh.geometry.mergeMesh(frameBack)
        }

        const walls = new THREE.Mesh(wallGeometry, shaderMaterial);
        walls.position.y = height;
        allWallsMesh.geometry.mergeMesh(walls);

        //floor.add(walls);

        const line1 = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 3), shaderMaterialLine);
        line1.position.set(-5.02, 0, -5.02);
        line1.position.y = height;
        allLinesMesh.geometry.mergeMesh(line1);

        const line2 = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 3), shaderMaterialLine);
        line2.position.set(5.02, 0, -5.02);
        line2.position.y = height;
        allLinesMesh.geometry.mergeMesh(line2);

        const line3 = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 3), shaderMaterialLine);
        line3.position.set(5.02, 0, 5.02);
        line3.position.y = height;
        allLinesMesh.geometry.mergeMesh(line3);

        const line4 = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 3), shaderMaterialLine); // TODO: Try making all geometries buffergeometry
        line4.position.set(-5.02, 0, 5.02);
        line4.position.y = height;
        allLinesMesh.geometry.mergeMesh(line4);

        return floor;
    }

    const distribution = [20, 10, 60]

    //const debugLine = 0.1;
    const debugLine = 0;

    for (let j = 0; j < distribution[0]; j++) {
        const height = distribution[1]*3 + debugLine + j * 3;
        const floor = makeFloor(textureCollection, deviance, height); // TODO: Separate out makeFrame (with one geometry)
        floor.position.y = height;
        this.add(floor);
    }

    // TODO: Gjør bygningene bak blassere
    // Lag skerukkestreker

    for (let j = 0; j < distribution[1]; j++) {
        const height = j * 3;
        const floor = makeFloor(textureCollection, deviance, height, this._imagePlanes);
        floor.position.y = height;
        this.add(floor);
    }

    for (let j = 0; j < distribution[2]; j++) {
        const height = -3 - debugLine + -j * 3;
        const floor = makeFloor(textureCollection, deviance, height);
        floor.position.y = height;
        this.add(floor);
    }

    this.add(allFramesMesh);
    this.add(allWallsMesh);
    this.add(allLinesMesh);
    this.add(allFrameBacksMesh);
  }

  get imagePlanes() {
    return this._imagePlanes;
  }

  updatePositions() {
    
  }
}