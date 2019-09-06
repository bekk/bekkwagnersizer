let cameraLockedVertices;
let lines;
let heightfield;

export function makeGridLines(heightfieldParam) {
    const material = new THREE.LineBasicMaterial({color: 0x2222dd});
    lines = new THREE.Object3D();

    heightfield = heightfieldParam;

    cameraLockedVertices = [];

    for (let i = 0; i < heightfield.length; i+=2) {
        const height = heightfield[i][0];

        const x = -10 + i;

        const geometry = new THREE.Geometry();
        const a = new THREE.Vector3(x, height, 0);
        const b = new THREE.Vector3(x, -50, 0);
        geometry.vertices.push(a, b);

        const line = new THREE.Line(geometry, material);
        line.geometry = geometry;

        lines.add(line);
    }

    return lines;
}
