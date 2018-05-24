import { ratio } from './util.js';

export default class Manhattan {

    constructor(renderer, textureCollection) {

        this._scene = new THREE.Scene();
        this._camera = new THREE.PerspectiveCamera(45, ratio(renderer), 0.1, 10000);
        
        //addResizeListener(this._camera, renderer);

        this.skyscrapers = [];

        //this._scene.add(textureCollection);

        for (let i = 0; i < 10; i++) {
            const manhattanMesh = new THREE.Mesh(
                new THREE.BoxGeometry(1, 10, 1),
                new THREE.MeshStandardMaterial()
            );
            manhattanMesh.position.set(3, 0, -5 - i * 4);
            this._scene.add(manhattanMesh);
            this.skyscrapers.push(manhattanMesh);
        }

        var lightManhattan = new THREE.DirectionalLight(0xffffff, 1.0);
        lightManhattan.position.set(-0.5, 2, 1).normalize();
        this._scene.add(lightManhattan);
    }

    get scene() {
        return this._scene;
    }

    get camera() {
        return this._camera;
    }

    animate() {
        const speed = 0.02;
        for (let skyscraper of this.skyscrapers) {
            skyscraper.position.z += speed;
            if (skyscraper.position.z > -5) {
                skyscraper.position.z = -50;
            }
        }
    }
}