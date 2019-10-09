let cylinderFrontMaterial;
let ballMesh;

export function makeBall(nofCylinderBodies) {
    const cylinderFrontMaterial = new THREE.MeshBasicMaterial({
        transparent: true,
        visible: true,
        wireframe: false,
        side: THREE.DoubleSide,
    });

    const cylinderMaterial = new THREE.MeshBasicMaterial({
        wireframe: true,
        visible: true,
        side: THREE.DoubleSide,
    });

    const planeMaterial = new THREE.MeshBasicMaterial({
        wireframe: false,
    });

    const cylinderGeometry = new THREE.CylinderGeometry(1.5, 1.5, 1.5, nofCylinderBodies);

    const ballMesh = new THREE.Mesh(cylinderGeometry, [cylinderMaterial, cylinderFrontMaterial, cylinderMaterial]);
    ballMesh.position.z = 3;
    cylinderGeometry.rotateX(Math.PI/2);
    ballMesh.cylinderFrontMaterial = cylinderFrontMaterial;
    
    return ballMesh;
}

export function initBall(nofCylinderBodies) {
    ballMesh = makeBall(nofCylinderBodies);
    return ballMesh;
}

export function setMap(texture) {
    ballMesh.cylinderFrontMaterial.map = texture;
    //cylinderFrontMaterial.map.anisotropy = Math.pow(2, 3);
    //cylinderFrontMaterial.minFilter = THREE.LinearMipMapLinearFilter;
    ballMesh.cylinderFrontMaterial.needsUpdate = true;
    

    ballMesh.visible = true;
}

export function updateCylinder(bodiesCenter, bodies) {
    const nofSpheres = bodies.length;

    for (let i = 0; i < nofSpheres; i++) {
        const body = bodies[i];

        const i1 = i;
        const i2 = i+nofSpheres;
        const vertex1 = ballMesh.geometry.vertices[i1];
        const vertex2 = ballMesh.geometry.vertices[i2];

        const cylinderRadius = 0.5;

        vertex1.set(body.position.x, body.position.y - cylinderRadius, vertex1.z);
        vertex2.set(body.position.x, body.position.y - cylinderRadius, vertex2.z);
    }

    const i1 = nofSpheres*2 + 0;
    const i2 = nofSpheres*2 + 1;
    const center1 = ballMesh.geometry.vertices[i1];
    const center2 = ballMesh.geometry.vertices[i2];

    center1.set(bodiesCenter.x, bodiesCenter.y, center1.z);
    center2.set(bodiesCenter.x, bodiesCenter.y, center2.z);

    ballMesh.geometry.vertices.map((v) => v.sub(bodiesCenter));
    ballMesh.position.copy(bodiesCenter);

    ballMesh.geometry.verticesNeedUpdate = true;
}

export function glitchBall() {
    ballMesh.visible = false;
}