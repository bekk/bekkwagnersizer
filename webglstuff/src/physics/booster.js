let boosters;

export function makeBoosters(heightfield) {
    const config = {
        8: "downer",

        30: "upper",
        58: "speeder",

        145: "downer",
        180: "speeder",
        215: "downer",

        281: "speeder",

        330: "upper",
        358: "speeder",
        
        405: "downer",
        440: "speeder",
        475: "downer",
    };

    const boosterHeight = 2.5;

    boosters = Object.keys(config).map(xCoord => {
        xCoord = parseInt(xCoord);
        return {
            position: new THREE.Vector3(xCoord - 10, -300 + heightfield[xCoord][0] + boosterHeight, 0),
            type: config[xCoord],
            mesh: null,
            time: null,
        }
    });

    return boosters;
}

export function updateBoosters(deltaSeconds) {
    for (const booster of boosters) {
        if (booster.used) {
            if (booster.time == undefined) {
                booster.time = 0;
            } else {
                booster.time += deltaSeconds;
            }

            const speed = 0.25 + booster.strength * 1.25;
            let factor = booster.time*speed;

            booster.mesh.scale.multiplyScalar(1.0 + factor);

            if (booster.time > 0.2) {
                booster.mesh.scale.set(1, 1, 1);
                booster.mesh.visible = false;
            }
        };
    }
}

export function makeBoosterMeshes() {
    // Boosters:

    const geometryTriangle = new THREE.CircleGeometry(1, 3);
    geometryTriangle.rotateZ(-Math.PI/3/2);

    const boosterMaterialUpper = new THREE.MeshBasicMaterial({
        color: new THREE.Color(0x2266FF)
    })
    const boosterMaterialSpeeder = new THREE.MeshBasicMaterial({
        color: new THREE.Color(0x22DD22)
    })
    const boosterMaterialDowner = new THREE.MeshBasicMaterial({
        color: new THREE.Color(0xDD22DD)
    })

    const container = new THREE.Object3D();
    container.name = "boosters";

    for (const booster of boosters) {
        const group = new THREE.Object3D();

        const material = booster.type == "upper" ? boosterMaterialUpper : (booster.type == "speeder" ? boosterMaterialSpeeder : boosterMaterialDowner);

        const first = new THREE.Mesh(geometryTriangle, material);
        group.add(first)
        first.position.y -= 0.5;
        const second = new THREE.Mesh(geometryTriangle, material);
        second.position.y += 0.5;
        group.add(second);

        group.rotation.z = booster.type == "upper" ? -Math.PI/4 : (booster.type == "speeder" ? -Math.PI/2 : -Math.PI*3/4);

        group.position.copy(booster.position);
        group.position.z = -0.1;
        group.position.y += 45; // TODO: Hvorfor dette??
        booster.mesh = group;
        container.add(group);
    }

    return container;
}