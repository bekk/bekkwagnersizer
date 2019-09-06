import {Random} from '../util.js';

/*
const tileGrid = [
    [[], ["S"], [], ["NE"]],
    [["E", "NW"], ["W", "N", "S"], ["S"], []],
    [[], ["N", "E", "SW"], ["N", "SE", "W"], []],
    [["W", "NE"], ["E"], ["E", "W"], ["NW", "S", "W"]],
]
*/

const tileGrid = randomTileGrid();

let lineMaterial;
let lineGeometry;
let dotGeometry;
let dotMaterial;

export function createBackdrop() {
    lineMaterial = new THREE.LineBasicMaterial({
        color: new THREE.Color(0xFFFFFF).multiplyScalar(0.05),
    })

    lineGeometry = new THREE.BufferGeometry();
    const positions = [
        0, 0, 0,
        0, 0.51, 0
    ];
    lineGeometry.addAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

    const dotRadius = 0.04;
    dotGeometry = new THREE.CircleBufferGeometry(dotRadius, 8);
    dotMaterial = new THREE.MeshBasicMaterial({
        color: new THREE.Color(0xFFFFFF).multiplyScalar(0.2),
    });

    const backdrop = new THREE.Object3D();

    for (let y = 0; y < tileGrid.length; y++) {
        for (let x = 0; x < tileGrid[y].length; x++) {
            const code = tileGrid[y][x];
            const tile = createTile(code);

            //tile.add(new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({transparent: true, opacity: 0.1})))

            tile.position.set(x - tileGrid[y].length/2, tileGrid.length/2 - y, 0);

            backdrop.add(tile);
        }
    }

    return backdrop;
}

export function updateBackdrop(deltaSeconds) {

}

function randomTileGrid() {
    const tileGrid = [];
    const gridSize = 50;

    for (let y = 0; y < gridSize; y++) {

        tileGrid.push(["E"]);

        for (let x = 1; x < gridSize; x++) {
            const codes = [];
            
            const codesLeft = x > 0 ? tileGrid[y][x-1] : [];
            const codesTop = y > 0 ? tileGrid[y-1][x] : [];
            const codesTopLeft = y > 0 && x > 0 ? tileGrid[y-1][x-1] : [];
            const codesTopRight = y > 0 && x+1 < tileGrid[y-1].length ? tileGrid[y-1][x+1] : [];

            if (codesLeft.indexOf("E") != -1) {
                codes.push("W");
            }
            if (codesTop.indexOf("S") != -1) {
                codes.push("N");
            }
            if (codesTopLeft.indexOf("SE") != -1) {
                codes.push("NW");
            }
            if (codesTopRight.indexOf("SW") != -1) {
                codes.push("NE");
            }

            const continueChance = 0.65;

            const stopChance = 0.15;

            if (Math.random() > stopChance) {
                if (Math.random() < continueChance) {
                    codes.push("SE");
                } else {
                    codes.push(Random.pick(["S", "E", "SE", "SW"]));
                }
            }

            tileGrid[y].push(codes);
        }
    }

    return tileGrid;
}

function createTile(codes) {
    const tile = new THREE.Object3D();

    const isStop = codes.length == 1;
    const isEmpty = codes.length == 0;

    if (isEmpty) {
        return tile;
    }

    for (const code of codes) {
        const line = new THREE.Line(lineGeometry, lineMaterial);
        line.rotation.z = getRotation(code);
        
        if (code.length == 2) { // Skråretninger
            line.scale.multiplyScalar(Math.sqrt(2)); // Diagonal
        }

        tile.add(line);
    }

    if (isStop) {
        const dot = new THREE.Mesh(dotGeometry, dotMaterial);
        //tile.add(dot);
    }

    return tile;
}

function getRotation(code) {
    const rotations = {
        N: 0,
        E: -Math.PI/2,
        S: Math.PI,
        W: Math.PI/2,
        NE: -Math.PI/4,
        NW: Math.PI/4,
        SE: -Math.PI/4 * 3,
        SW: Math.PI/4 * 3
    }

    return rotations[code];
}