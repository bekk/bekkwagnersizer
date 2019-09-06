const textElement = document.getElementById("entryloaderText");
let timeSeconds = 0;
let queueIndex = 0;
let blobMaterial;
let spinnerIndex = 0;
let spinningTime = 0;
let blob;
let fykeTime = null;

import {Random, clamp, easeOutCubic, easeInOutSine} from '../util.js';

const height = 4.2;
const width = 5.5;
const titlebarHeight = 0.55;
const dotRadius = 0.125;
const dotSpread = 0.1;
const blobSize = 2;
const blobResolution = 10
const blobYPosition = - height + blobSize / 2 * 1.15;

const blobStartPosition = new THREE.Vector3(width/2, blobYPosition, 0);

export function makeEntryLoader() {
    const container = new THREE.Object3D();

    const material = new THREE.LineBasicMaterial({color: 0xFFFFFF});
    const geometry = new THREE.Geometry();

    geometry.vertices.push(
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(width, 0, 0),
        new THREE.Vector3(width, -height, 0),
        new THREE.Vector3(0, -height, 0),
        new THREE.Vector3(0, 0, 0),

        new THREE.Vector3(0, -titlebarHeight, 0),
        new THREE.Vector3(width, -titlebarHeight, 0),
    );

    const frame = new THREE.Line(geometry, material);
    container.add(frame);

    const dotGeometry = new THREE.CircleBufferGeometry(dotRadius, 16);
    const blueDot = new THREE.Mesh(dotGeometry, new THREE.MeshBasicMaterial({color: 0x1717E5, side: THREE.DoubleSide}));
    const greenDot = new THREE.Mesh(dotGeometry, new THREE.MeshBasicMaterial({color: 0x22ee22}));
    const purpleDot = new THREE.Mesh(dotGeometry, new THREE.MeshBasicMaterial({color: 0xff22ff}));
    greenDot.position.x = dotRadius*2 + dotSpread;
    purpleDot.position.x = greenDot.position.x + dotRadius*2 + dotSpread;
    const dots = new THREE.Object3D();
    dots.add(blueDot, greenDot, purpleDot);
    dots.position.set(titlebarHeight/2, -titlebarHeight/2, 0);
    container.add(dots);

    blobMaterial = new THREE.MeshBasicMaterial({transparent: true, map: undefined, side: THREE.DoubleSide});
    const noMaterial = new THREE.MeshBasicMaterial({transparent: true, opacity: 0});
    blob = new THREE.Mesh(new THREE.PlaneGeometry(blobSize, blobSize, blobResolution, 1), [blobMaterial, noMaterial]);
    blob.rotation.z = Math.PI/2;
    blob.rotation.y = Math.PI;
    container.add(blob);

    container.scale.multiplyScalar(0.1);

    restartEntryLoader();

    return container;
}

export function animateEntryLoader(deltaSeconds) {
    timeSeconds += deltaSeconds;

    const rate = 30;
    const startIndex = 11;
    const blinkRate = 3;
    const spinningSpeed = 5;

    const spinner = ["/", "-", "\\", "|"][spinnerIndex];

    let i = startIndex + Math.floor(timeSeconds * rate);

    const loadingDone = i > 220;
    const isSpinning = i > 40 && i < 100;

    if (loadingDone) { 
        i = startIndex;
        
        if (fykeTime == null) {
            fykeTime = 0;
        }
        
        blob.position.copy(blobStartPosition.clone().lerp(new THREE.Vector3(-19, -10, 0), easeInOutSine(fykeTime)));
        const fykeTimeInverse = clamp(1 - fykeTime, 0.1, 1.0);

        blobMaterial.opacity = 1 - fykeTime;
        blob.scale.set(fykeTimeInverse, fykeTimeInverse, fykeTimeInverse);
        const fykeSpeed = 1.5;

        if (fykeTime < 1) {
            fykeTime += deltaSeconds * fykeSpeed;
        }

        if (fykeTime == 1) {
            blob.visible = false;
            fykeTime = null;
        }
    } else if (isSpinning) {
        blob.visible = true;
        spinningTime += deltaSeconds;
    }

    animateBlob();

    if (isSpinning) {
        spinnerIndex = Math.floor(timeSeconds * spinningSpeed) % 4;
    }

    const template = 
`&gt; bekk$ mainframe load blob     \n${spinner} ...loading                                                                           \n[god]: compiled successfully.    \n# ${queueIndex} in queue of death.                        `;

    let html = template.substr(0, i);

    if (i == startIndex && Math.floor(timeSeconds * blinkRate) % 2 == 0) {
        html += "|"
    }

    html = html.split("\n").join("<br/>");

    textElement.innerHTML = html;
}

function animateBlob() {
    let i = 0;
    for (const face of blob.geometry.faces) {
        const magicMax = 8;
        const magicSpeed = 4;
        const magic = clamp(magicMax - Math.floor(spinningTime * magicSpeed), 1, magicMax);
        if (i % magic == 0) {
            face.materialIndex = 0;
        } else {
            face.materialIndex = 1;
        }
        i++;
    }
    blob.geometry.elementsNeedUpdate = true;
}

export function restartEntryLoader(texture, queueIndexParam) {
    timeSeconds = 0;
    queueIndex = queueIndexParam;

    fykeTime = null;
    blob.position.copy(blobStartPosition);
    blobMaterial.opacity = 1;
    blob.scale.set(1, 1, 1);

    spinningTime = 0;

    blobMaterial.map = texture;
    blobMaterial.needsUpdate = true;
        
    blob.visible = false;
}