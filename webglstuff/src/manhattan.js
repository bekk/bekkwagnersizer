import { ratio, Random, gridPosition2D, planeBufferGeometry, computeGeometry } from './util.js';

import fragmentShaderCode from './fragmentshader.glsl';
import fragmentShaderCodeFrame from './fragmentshaderframe.glsl';
import fragmentShaderCodeImage from './fragmentshaderimage.glsl';
import vertexShaderCode from './vertexshader.glsl';
import PlingPlongTransition from "./pling-plong-transition.js";

const uniforms = {
    time: {value: 0},
};

// TODO: Lag de nøærmeste vinduene lyseblå, og resten lilla

export default class Manhattan {

    constructor(renderer, textureCollection) {
        this._scene = new THREE.Scene();
        this._camera = new THREE.PerspectiveCamera(90, ratio(renderer), 0.01, 10000);
        this._camera.position.set(0, 6, -15);
        this._camera.updateProjectionMatrix();

        this.skyscrapers = [];

        this.orbitControls = new THREE.OrbitControls(this._camera);
        this.orbitControls.target = this._camera.position.clone().add(new THREE.Vector3(0, -5, -20));
        this.orbitControls.update();

        this._camera.orbitControls = this.orbitControls;

        var lightManhattan = new THREE.DirectionalLight(0xffffff, 1.0);
        lightManhattan.position.set(-0.5, 1, 1).normalize();
        this._scene.add(lightManhattan);

         const wallPalette = [
            new THREE.Color(0xe423bc),
            new THREE.Color(0xfffe47),
            new THREE.Color(0xf9d1ae),
            new THREE.Color(0x02e8ff),
            new THREE.Color(0x05d17c),
            new THREE.Color(0xefefef),
        ];

        for (let color of wallPalette) color.addScalar(0.1)

        const levels = 8;

        let flippy = 1;
        for (let i = 0; i < levels*2; i++) {
            const level = Math.floor(i/2);
            const position = new THREE.Vector3(
                15 * flippy * THREE.Math.lerp(1, 0.2, level/levels), 
                -10 + Math.random(), 
                -25 - level*15 + 2*flippy
            );
            const nearCamera = Math.abs(position.z) < 100;
            const angleToCamera = Math.abs(position.z) < 65;  

            const color = wallPalette[i % wallPalette.length].clone().addScalar(THREE.Math.lerp(0, 0.6, level/levels));

            const lineThickness = THREE.Math.lerp(0.05, 0.45, level/levels)*0.6;
            const skyscraper = new ManhattanObject3D(
                textureCollection, flippy, nearCamera, angleToCamera, lineThickness, color
            );
            skyscraper.position.copy(position);
            this._scene.add(skyscraper);
            this.skyscrapers.push(skyscraper);
            flippy *= -1;
        }


        this.oldY = this._camera.position.y;
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

    zoomAmount(normalizedZoom) {
        const invertedNorm = 1 - normalizedZoom;

        const startZoom = 0.6;
        const endZoom = 1.0;
        this.camera.zoom = startZoom + normalizedZoom * (endZoom - startZoom);
        this.camera.updateProjectionMatrix();

        this.camera.position.y = this.oldY - invertedNorm * 4.2;
        this.camera.orbitControls.target.y = this.camera.position.y - 5 - 2.1 * invertedNorm;
    }

    //TODO: Større hoder, mindre skuldre
    //TDOO: Skyggelegging i karmer og på vegger

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

function makeFrameLinesGeometry(type, lineThickness, flippy) {
    const frameDepth = 0.2;
    let framebox = new THREE.Geometry();

    // TODO: DRY
    if (type == "XY") {
        for (let i = 0; i < 2; i++) {
            const geometry = new THREE.BoxGeometry(1.5, 1.5, 0.1);
            delete geometry.faces.splice(8, 4);
            for (let vertex of geometry.vertices) vertex.z = i * frameDepth;

            geometry.vertices[0].multiplyScalar(1 - lineThickness);
            geometry.vertices[2].multiplyScalar(1 - lineThickness);
            geometry.vertices[5].multiplyScalar(1 - lineThickness);
            geometry.vertices[7].multiplyScalar(1 - lineThickness);

            computeGeometry(geometry);

            framebox.mergeMesh(new THREE.Mesh(geometry));
        }

        for (let x = -1; x <= 1; x+=2) {
            for (let y = -1; y <= 1; y+=2) {
                const geometry = new THREE.PlaneGeometry(frameDepth, lineThickness);
                const mesh = new THREE.Mesh(geometry);
                mesh.position.set(x, y, 0).multiplyScalar(1.5/2);
                mesh.position.z = frameDepth/2;
                mesh.position.y -= lineThickness/2 * y;
                mesh.rotation.y = Math.PI/2;
                framebox.mergeMesh(mesh);
            }
        }
    } else {
        for (let i = 0; i < 2; i++) {
            const geometry = new THREE.BoxGeometry(0.1, 1.5, 1.5);
            delete geometry.faces.splice(0, 4);
            for (let vertex of geometry.vertices) vertex.x = i * frameDepth * flippy;

            geometry.vertices[0].multiplyScalar(1 - lineThickness);
            geometry.vertices[1].multiplyScalar(1 - lineThickness);
            geometry.vertices[2].multiplyScalar(1 - lineThickness);
            geometry.vertices[3].multiplyScalar(1 - lineThickness);

            framebox.mergeMesh(new THREE.Mesh(geometry));
        }

        for (let z = -1; z <= 1; z+=2) {
            for (let y = -1; y <= 1; y+=2) {
                const geometry = new THREE.PlaneGeometry(frameDepth, lineThickness);
                const mesh = new THREE.Mesh(geometry);
                mesh.position.set(0, y, z).multiplyScalar(1.5/2);
                mesh.position.x = frameDepth/2 * flippy;
                mesh.position.y -= lineThickness/2 * y;
                framebox.mergeMesh(mesh);
            }
        }
    }

    return framebox;
}

function makeFrameSides(type, lineThickness, flippy) {
    let framesides = new THREE.Geometry();
    const frameDepth = 0.2;

    // TODO: DRY
    if (type == "XY") {
        let localFramesides = new THREE.Geometry();

        for (let x = -1; x <= 1; x+=2) {
            const geometry = new THREE.PlaneGeometry(frameDepth-lineThickness/2, 1.5-lineThickness*2);
            const mesh = new THREE.Mesh(geometry);
            mesh.position.set(frameDepth, 0, -(1.5/2 - 0.025) * x);
            localFramesides.mergeMesh(mesh);
        }

        for (let y = -1; y <= 1; y+=2) {
            const geometry = new THREE.PlaneGeometry(frameDepth-lineThickness/2, 1.5-lineThickness*2);
            const mesh = new THREE.Mesh(geometry);
            mesh.rotation.x = Math.PI/2;
            mesh.position.set(frameDepth, -(1.5/2 - 0.025) * y, 0);
            localFramesides.mergeMesh(mesh);
        }

        const localFramesidesMesh = new THREE.Mesh(localFramesides);
        localFramesidesMesh.rotation.y = -Math.PI/2;
        framesides.mergeMesh(localFramesidesMesh);
    } else {
        for (let x = -1; x <= 1; x+=2) {
            const geometry = new THREE.PlaneGeometry(frameDepth-lineThickness/2, 1.5-lineThickness*2);
            const mesh = new THREE.Mesh(geometry);
            mesh.position.set(frameDepth/2 * flippy, 0, -(1.5/2 - 0.025) * x);
            framesides.mergeMesh(mesh);
        }

        for (let y = -1; y <= 1; y+=2) {
            const geometry = new THREE.PlaneGeometry(frameDepth-lineThickness/2, 1.5-lineThickness*2);
            const mesh = new THREE.Mesh(geometry);
            mesh.rotation.x = Math.PI/2;
            mesh.position.set(frameDepth/2 * flippy, -(1.5/2 - 0.025) * y, 0);
            framesides.mergeMesh(mesh);
        }
    }

    return framesides;
}

function makeWallGeometry() {

    function makeWall() {
        let side = new THREE.Geometry();

        for (let y = -1; y <= 1; y += 2) {
            const wallGeometry = new THREE.PlaneGeometry(10, 0.75);
            computeGeometry(wallGeometry);

            const mesh = new THREE.Mesh(wallGeometry);
            mesh.position.set(0, (1.5/2+0.75/2)*y, 0);
            side.mergeMesh(mesh);
        }

        for (let x = -1; x <= 1; x += 1) {
            const wallGeometry = new THREE.PlaneGeometry(1, 1.5);
            computeGeometry(wallGeometry);

            const mesh = new THREE.Mesh(wallGeometry);
            mesh.position.set(x*(1.5+0.5*2), 0, 0);
            side.mergeMesh(mesh);
        }

        for (let x = -1; x <= 1; x += 2) {
            const wallGeometry = new THREE.PlaneGeometry(0.5, 1.5);
            computeGeometry(wallGeometry);

            const mesh = new THREE.Mesh(wallGeometry);
            mesh.position.set(x*(5-0.25), 0, 0);
            side.mergeMesh(mesh);
        }

        return side;
    }

    const sideMesh1 = new THREE.Mesh(makeWall());
    sideMesh1.position.z = 5;
    const sideMesh2 = new THREE.Mesh(makeWall());
    sideMesh2.position.x = -5;
    sideMesh2.rotation.y = Math.PI/2;
    const sideMesh3 = new THREE.Mesh(makeWall());
    sideMesh3.position.x = 5;
    sideMesh3.rotation.y = Math.PI/2;

    const wall = new THREE.Geometry();
    wall.mergeMesh(sideMesh1);
    wall.mergeMesh(sideMesh2);
    wall.mergeMesh(sideMesh3);

    return wall;
}

class ManhattanObject3D extends THREE.Object3D {
  constructor(textureCollection, flippy, nearCamera, angleToCamera, lineThickness, color) {
    super();

    this._imagePlanes = [];

    const deviance = Random.float(0, 1);

    const uniformsWalls = {
        time: uniforms.time,
        deviance: {value: deviance},
        color: {value: color},
    }

    const uniformsFrame = {
        time: uniforms.time,
        deviance: {value: deviance},
        //color: {value: new THREE.Color(0x62d8fe)},
        color: {value: uniformsWalls.color.value.clone().multiplyScalar(0.65)},
    }

    const uniformsFrameSides = {
        time: uniforms.time,
        deviance: {value: deviance},
        //color: {value: new THREE.Color(0x5600eb)},
        color: {value: uniformsWalls.color.value.clone().multiplyScalar(0.85)},
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
        side: THREE.DoubleSide,
    });

    const shaderMaterialFrame = new THREE.ShaderMaterial({
        uniforms: uniformsFrame,
        vertexShader: vertexShaderCode,
        fragmentShader: fragmentShaderCodeFrame,
        transparent: false,
        side: THREE.DoubleSide,
    }); 

    const shaderMaterialFrameSides = new THREE.ShaderMaterial({
        uniforms: uniformsFrameSides,
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

    const allFrameSidesMesh = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.5, 0.1), shaderMaterialFrameSides);
    // TODO: allFramesMesh kan vel være en del av allLinesMesh
    const allFramesMesh = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.5, 0.1), shaderMaterialLine); // TODO: Initialize wihtout geometry?
    const allFrameBacksMesh = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.5, 0.1), shaderMaterialFrame);
    const allWallsMesh = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.5, 0.1), shaderMaterial);
    const allLinesMesh = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.5, 0.1), shaderMaterialLine);

    const frameGeometry1 = makeFrameLinesGeometry("XY", lineThickness, flippy);
    const frameGeometry2 = makeFrameLinesGeometry("ZY", lineThickness, flippy);
    const frameBackGeometry1 = new THREE.PlaneGeometry(1.6, 1.6);
    const frameBackGeometry2 = planeBufferGeometry('ZY', 1.6, 1.6);

    const planeGeometry1 = new THREE.PlaneBufferGeometry(1.75, 1.75);
    const planeGeometry2 = planeBufferGeometry('ZY', 1.75, 1.75);

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

    const wallGeometry = makeWallGeometry();

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

            const debugDistance = 0; // 2;

            if (i < nofWindows) {
                frame = new THREE.Mesh(frameGeometry1, shaderMaterialLine)
                plane.position.y = -0.1;
                plane.position.x = (i%nofWindows - nofWindows/2) / nofWindows * spread + 1.25;
                plane.position.z = (5 - 0.175) + debugDistance;
            
                frame.position.copy(plane.position);
                frame.position.z -= 0.0;
            } else {
                frame = new THREE.Mesh(frameGeometry2, shaderMaterialLine);
                plane.position.y = -0.1;
                plane.position.z = (i%nofWindows - nofWindows/2) / nofWindows * spread + 1.25
                plane.position.x = (-5 + 0.175 - debugDistance) * flippy;
            
                frame.position.copy(plane.position);

                //frame.rotation.y = Math.PI;
                frame.position.x -= 0.2 * flippy;
            }

            const shoulders = plane.clone();
            shoulders.scale.y = 0.2;
            if (i < nofWindows) shoulders.position.z -= 0.005; else shoulders.position.x += 0.025*flippy
            shoulders.position.y -= 0.5;
            shoulders.material = shouldersImageMaterial;
            if (includePlane) floor.add(shoulders)

            frame.position.y = height;
            if (nearCamera) allFramesMesh.geometry.mergeMesh(frame);

            const frameBackGeometry = i < nofWindows ? frameBackGeometry1 : frameBackGeometry2;
            const frameBack = new THREE.Mesh(frameBackGeometry, shaderMaterialFrame);
            frameBack.position.copy(frame.position);
            //frameBack.rotation.y = Math.PI;
            if (i < nofWindows) frameBack.position.z -= 0.01; else frameBack.position.x += 0.25*flippy
            allFrameBacksMesh.geometry.mergeMesh(frameBack)

            const frameSidesGeometry = makeFrameSides(i < nofWindows ? "XY" : "ZY", lineThickness, flippy);
            const frameSides = new THREE.Mesh(frameSidesGeometry, shaderMaterialFrameSides);
            frameSides.position.copy(frame.position);
            if (i < nofWindows) frameSides.position.z -= 0.1; else frameSides.position.x += 0.0*flippy
            if (angleToCamera) allFrameSidesMesh.geometry.mergeMesh(frameSides)
        }

        const walls = new THREE.Mesh(wallGeometry, shaderMaterial);
        walls.position.y = height;
        allWallsMesh.geometry.mergeMesh(walls);

        //floor.add(walls);

        function addLine(position, height) {
            const line1 = new THREE.Mesh(new THREE.PlaneGeometry(lineThickness, height), shaderMaterialLine);
            line1.position.copy(position);
            allLinesMesh.geometry.mergeMesh(line1); 
        }

        const m = 1.5/2+0.75/2;

        addLine(new THREE.Vector3(-5.02, height + m, -5.02), 0.75);
        addLine(new THREE.Vector3(-5.02, height, -5.02), 1.5);
        addLine(new THREE.Vector3(-5.02, height - m, -5.02), 0.75);

        addLine(new THREE.Vector3(5.02, height + m, -5.02), 0.75);
        addLine(new THREE.Vector3(5.02, height, -5.02), 1.5);
        addLine(new THREE.Vector3(5.02, height - m, -5.02), 0.75);

        addLine(new THREE.Vector3(5.02, height + m, 5.02), 0.75);
        addLine(new THREE.Vector3(5.02, height, 5.02), 1.5);
        addLine(new THREE.Vector3(5.02, height - m, 5.02), 0.75);

        addLine(new THREE.Vector3(-5.02, height + m, 5.02), 0.75);
        addLine(new THREE.Vector3(-5.02, height, 5.02), 1.5);
        addLine(new THREE.Vector3(-5.02, height - m, 5.02), 0.75);

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
    this.add(allFrameSidesMesh);
  }

  get imagePlanes() {
    return this._imagePlanes;
  }

  updatePositions() {
    
  }
}