import { ratio, Random, gridPosition2D } from './util.js';

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
        this._camera.position.set(0, cameraHeight, 2.55);
        this._camera.updateProjectionMatrix();

        this.skyscrapers = [];

        this.orbitControls = new THREE.OrbitControls(this._camera);
        this.orbitControls.target = new THREE.Vector3(0, cameraHeight, -20);
        this.orbitControls.update();

        var lightManhattan = new THREE.DirectionalLight(0xffffff, 1.0);
        lightManhattan.position.set(-0.5, 1, 1).normalize();
        this._scene.add(lightManhattan);

        this.manhattanObject3D = new ManhattanObject3D(textureCollection);
        this.manhattanObject3D.position.set(10, -10, -25)
        this._scene.add(this.manhattanObject3D);
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

        const index = Random.int(0, this.manhattanObject3D.imagePlanes.length - 1)

        const plane = this.manhattanObject3D.imagePlanes[index];

        plane.uforms.map.value = image;
        //plane.material.map.anisotropy = Math.pow(2, 3);
        //plane.material.map.minFilter = THREE.LinearMipMapLinearFilter;
        plane.material.needsUpdate = true;
    }
}

const shaderMaterial = new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: vertexShaderCode,
    fragmentShader: fragmentShaderCode,
    transparent: false,
});

const shaderMaterialFrame = new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: vertexShaderCode,
    fragmentShader: fragmentShaderCodeFrame,
    transparent: false,
});

function makeFloor(textureCollection, imagePlanes) {
    const floor = new THREE.Object3D();

    const texture = textureCollection.getDefault();

    // TODO: DRY
    for (let i = 0; i < 5; i++) {
      /*let imageMaterial = new THREE.MeshBasicMaterial({
        transparent: true,
        map: texture,
        side: THREE.DoubleSide,
      });*/

        const imageUniforms = {
            time: uniforms.time,
            map: {type: "t", value: texture},
        }

        const imageMaterial = new THREE.ShaderMaterial({
            uniforms: imageUniforms,
            vertexShader: vertexShaderCode,
            fragmentShader: fragmentShaderCodeImage,
            transparent: true,
        });

      const plane = new THREE.Mesh(new THREE.PlaneGeometry(1,1), imageMaterial);
      plane.uforms = imageUniforms;
      plane.texture = texture;

      const spread = 10;

      plane.position.y = 0;
      plane.position.x = (i - 5/2) / 5 * spread + 1;
      plane.position.z = 5.1;
      
      floor.add(plane);
      if (imagePlanes) imagePlanes.push(plane);

      const frame = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 0.1), shaderMaterialFrame);
      frame.position.copy(plane.position);
      frame.position.z -= 0.1;
      floor.add(frame);
    }

    for (let i = 0; i < 5; i++) {
      /*let imageMaterial = new THREE.MeshBasicMaterial({
        transparent: true,
        map: texture,
        side: THREE.DoubleSide,
      });*/

              const imageUniforms = {
            time: uniforms.time,
            map: {type: "t", value: texture},
        }

        const imageMaterial = new THREE.ShaderMaterial({
            uniforms: imageUniforms,
            vertexShader: vertexShaderCode,
            fragmentShader: fragmentShaderCodeImage,
            transparent: true,
            side: THREE.DoubleSide
        });

        const geometry = new THREE.PlaneGeometry(1,1);
        geometry.vertices[0].set(0, 0.5, -0.5);
        geometry.vertices[1].set(0, 0.5, 0.5);
        geometry.vertices[2].set(0, -0.5, 0.5);
        geometry.vertices[3].set(0, -0.5, -0.5);
        geometry.faces[0].a = 1;
        geometry.faces[0].b = 2;
        geometry.faces[0].c = 0;
        geometry.faces[1].a = 2;
        geometry.faces[1].b = 3;
        geometry.faces[1].c = 0;
        geometry.verticesNeedUpdate = true;
        geometry.uvsNeedUpdate = true;
        geometry.computeFlatVertexNormals();
        geometry.computeVertexNormals();

    geometry.computeVertexNormals()
    geometry.computeFaceNormals();
    geometry.computeMorphNormals();
    geometry.computeBoundingSphere();
    geometry.computeBoundingBox();
    
    geometry.verticesNeedUpdate = true;
    geometry.elementsNeedUpdate = true;
    geometry.uvsNeedUpdate = true;
    geometry.normalsNeedUpdate = true;
    geometry.tangentsNeedUpdate = true;
    geometry.colorsNeedUpdate = true;
    geometry.lineDistancesNeedUpdate = true;
    geometry.buffersNeedUpdate = true;
    geometry.groupsNeedUpdate = true;

      const plane = new THREE.Mesh(geometry, imageMaterial);
      plane.uforms = imageUniforms;
      plane.texture = texture;

      const spread = 10;

      plane.position.y = 0;
      plane.position.z = (i - 5/2) / 5 * spread + 1;
      plane.position.x = -5.1;
      
      floor.add(plane);
      if (imagePlanes) imagePlanes.push(plane);

      const frame = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1, 1), shaderMaterialFrame);
      frame.position.copy(plane.position);
      frame.position.x -= -0.1;
      floor.add(frame);
    }

    const walls = new THREE.Mesh(new THREE.BoxGeometry(10, 2, 10), shaderMaterial);
    walls.position.y = 0;

    floor.add(walls);

    return floor;
}

class ManhattanObject3D extends THREE.Object3D {
  constructor(textureCollection) {
    super();

    this._imagePlanes = [];

    for (let j = 0; j < 30; j++) {
        const floor = makeFloor(textureCollection);
        floor.position.y = -3 + -j * 2;
        this.add(floor);
    }

    for (let j = 0; j < 10; j++) {
        const floor = makeFloor(textureCollection, this._imagePlanes);
        floor.position.y = j * 2;
        this.add(floor);
    }

    for (let j = 0; j < 30; j++) {
        const floor = makeFloor(textureCollection);
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