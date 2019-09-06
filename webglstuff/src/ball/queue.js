import {makeBall} from '.';

let queue, queueMesh, rings;
let queueYCoordinate = 0;

const queueYSpread = -0.5;
const spreadX = 1.1;

const minQueueBallYPosition = -11;

let flippa = 1;

let ringList = [];


export function makeQueue() {
    queue = [];
    queueMesh = new THREE.Object3D();

    const container = new THREE.Object3D();
    container.add(queueMesh);

    rings = makeRings(10, 64, 0.33);
    container.add(rings);

    container.scale.multiplyScalar(0.55);

    return container;
}

function makeRings(nofRings, nofEdges, ySpread) {
    const rings = new THREE.Object3D();

    for (let i = 0; i < nofRings; i++) {

        const geometry = new THREE.Geometry();

        for (let j = 0; j <= 1; j += 1/nofEdges) {
            const a = new THREE.Vector3(Math.sin(j * Math.PI*2), 0, Math.cos(j * Math.PI*2));
            geometry.vertices.push(a);
        }

        const ringMaterial = new THREE.LineBasicMaterial({color: new THREE.Color(0xffffff)});

        const ring = new THREE.Line(geometry, ringMaterial);

        ring.initY = nofRings/2 * ySpread - i * ySpread;
        ring.position.y = ring.initY;
        ring.rotation.x = 0.32;

        rings.add(ring)

        ringList.push(ring);
    }

    rings.position.y = -nofRings/2 - 0.5;
    rings.scale.multiplyScalar(3);

    return rings;
}

export function queuePush(texture) {
    queueYCoordinate -= texture.repeat.y * 1.5 * 2 ;

    const ball = makeBall(24);
    ball.scale.z = 0.1;
    ball.rotation.y = Math.PI;
    ball.cylinderFrontMaterial.map = texture;
    ball.cylinderFrontMaterial.needsUpdate = true;
    ball.position.y = queueYCoordinate;
    ball.position.z = Math.random(); // For z-buffer conflict

    ball.originX = flippa * spreadX;
    flippa = -flippa;

    queueYCoordinate -= queueYSpread;

    ball.bodysize = texture.repeat;

    ball.rotation.z = Math.PI;
    ball.geometry.translate(0, -1.5, 0);
    ball.geometry.elementsNeedUpdate = true;

    queue.push(ball);
    queueMesh.add(ball);
}

export function queuePop() {
    if (queue.length == 0){
        return;
    }

    const ball = queue.shift();

    queueMesh.remove(queueMesh.children[0]);
    queueMesh.position.y += ball.bodysize.y * 3 + queueYSpread;

    return ball.cylinderFrontMaterial.map;
}


export function queueLength() {
    return queue.length;
}

export function animateQueue(timeSeconds) {
    const wobbleAmplitude = 0.04;
    const wobbleFrequency = 8;
    const xWobbleFrequency = 1.5;
    const xWobbleAmplitude = 0.6;

    let nofInQueue = 0;

    for (const mesh of queueMesh.children) {
        const wobble = wobbleAmplitude * Math.sin(timeSeconds * wobbleFrequency + mesh.position.y);

        mesh.scale.x = mesh.cylinderFrontMaterial.map.repeat.x;
        mesh.scale.y = mesh.cylinderFrontMaterial.map.repeat.y;

        mesh.scale.y += wobble;
        mesh.scale.x += - wobble/2;

        mesh.position.x = mesh.originX + Math.sin(timeSeconds * xWobbleFrequency + mesh.position.y) * xWobbleAmplitude;

        mesh.visible = mesh.position.y + queueMesh.position.y > minQueueBallYPosition;

        if (mesh.visible) nofInQueue++;
    }

    const ringGlowSpeed = 2;
    const glowFrequency = 0.5;
    const sparseness = 0.6;

    for (const i in ringList) {
        let timeFactor = (Math.sin(timeSeconds * ringGlowSpeed + i * glowFrequency) + 1) / 2;
        //timeFactor = Math.max(0, timeFactor);

        ringList[i].material.color = new THREE.Color(0x181818).lerp(new THREE.Color(0x555555), timeFactor);
    }


    const nofOverflowed = queueLength() - nofInQueue;

    document.getElementById("queueOverflowNumber").innerText = nofOverflowed;
    document.getElementById("queueOverflow").classList.toggle("hidden", nofOverflowed <= 0);
}
