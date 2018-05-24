import { ratio, addResizeListener } from './util.js';
import RealtimeTextureCollection from "./realtime-texture-collection.js";

export default class People {

    constructor(renderer) {
        // 256 stykker på 1024^2 ser ut til å være en øvre grense for rendringen nå
        // eller overkant av 1000 stykker på 512^2
        const nofTextures = 100;
        const textureWidth = 512;
        const textureHeight = 512;

        const cameraHeight = 0.4;
        this._camera = new THREE.PerspectiveCamera(45, ratio(renderer), 0.1, 10000);
        this._camera.position.set(0, cameraHeight, 2.55);
        this._camera.updateProjectionMatrix();

        this.orbitControls = new THREE.OrbitControls(this._camera);
        this.orbitControls.target = new THREE.Vector3(0, cameraHeight, 0);
        this.orbitControls.update();

        this._scene = new THREE.Scene();

        this.textureCollection = new RealtimeTextureCollection(nofTextures, textureWidth, textureHeight);
        this._scene.add(this.textureCollection);

        const purplePlane = new THREE.Mesh(
            new THREE.PlaneGeometry(5,2),
            new THREE.MeshBasicMaterial({
                color: new THREE.Color(0xbc1a8d)
            })
        );
        purplePlane.position.set(0, -0.5, 0.2);
        this._scene.add(purplePlane);

        var lightSun = new THREE.DirectionalLight(0xffffff, 1.0);
        lightSun.position.set(-0.5, 4, 1).normalize();
        this._scene.add(lightSun);

        addResizeListener(this._camera, renderer);
    }

    get scene() {
        return this._scene;
    }

    get camera() {
        return this._camera;
    }

    animate() {
        this.textureCollection.updatePositions();

        this.orbitControls.update();
    }

    addTexture(texture) {
        this.textureCollection.updateImage(texture, this.textureCollection.getIndexInBack());
    }
}