import {fetchTextureFromServer, Random} from '../util.js';

export function createBackdrop() {
    const material = new THREE.MeshBasicMaterial({
        color: new THREE.Color(0xFFFFFF),
        map: fetchTexture(),
    });

    const backdrop = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), material);
    backdrop.position.set(30, -10, 0);

    const nofStars = 100;
    const starRadius = 0.065;
    const starGlowStrength = 1.0;
    const starRaySharpness = 2;
    const starSize = 0.5;

    const dotGeometry = new THREE.CircleBufferGeometry(starRadius, 6);
    const lineGeometry = new THREE.CircleBufferGeometry(starRadius*3, 4);

    const dotMaterial = new THREE.MeshBasicMaterial({
        color: new THREE.Color(0xFFFFFF).multiplyScalar(starGlowStrength),
    });

    const lineMaterial = new THREE.MeshBasicMaterial({
        color: new THREE.Color(0xFFFFFF).multiplyScalar(starGlowStrength/2),
    });

    const stars = new THREE.Object3D();
    for (let i = 0; i < nofStars; i++) {
        const star = new THREE.Object3D();

        const dot = new THREE.Mesh(dotGeometry, dotMaterial);
        star.add(dot);

        const verticalLine = new THREE.Mesh(lineGeometry, lineMaterial);
        verticalLine.scale.x = 1/starRaySharpness;
        star.add(verticalLine);

        const horisontalLine = new THREE.Mesh(lineGeometry, lineMaterial);
        horisontalLine.scale.y = 1/starRaySharpness;
        star.add(horisontalLine);

        star.scale.multiplyScalar(starSize);

        star.position.set(Random.float(-0.5, 0.5) * 120, Random.float(-0.5, 0.5) * 120, 0.1);
        stars.add(star);
    }
    stars.position.copy(backdrop.position);

    const container = new THREE.Object3D();
    container.add(backdrop);
    container.add(stars);

    return container;
}

export function updateBackdrop(deltaSeconds) {

}


function fetchTexture() {
    const texture = fetchTextureFromServer(`http://localhost:3000/internal/glitch-tile.png`);

    //texture.rotation = Math.PI/2;

    const scale = 0.07;
    texture.repeat.set(1/scale, 1/scale);

    texture.wrapS = THREE.MirroredRepeatWrapping;
    texture.wrapT = THREE.MirroredRepeatWrapping;

    texture.needsUpdate = true;

    return texture;
}