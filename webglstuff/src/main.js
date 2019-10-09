THREE.OrbitControls = require('three-orbit-controls')(THREE);

import ioClient from 'socket.io-client';
import CANNON from 'cannon';

import shape2mesh from "./shape2mesh.js";
import {setUpComposer} from './postprocessing';
import {createBackdrop, updateBackdrop} from './backdrop';
import {createBackdrop as createTexturedBackdrop, updateBackdrop as updateTexturedBackdrop} from './backdrop/textured.js';
import {initPhysics, resetPhysics, updatePhysics, getHeightfieldBody, getCylinderBodies, teleportTo, scaleVelocity} from './physics';
import {makeHeightField} from './physics/heightfield';
import {makeBoosters, updateBoosters, makeBoosterMeshes} from './physics/booster.js';
import {analyzeImage} from './edgedetection';
import {makeBall, updateCylinder, setMap, initBall, glitchBall} from './ball';
import {registerGoalTime, getTopGoalTimes, makeHighscoreHtml, saveHighscore, loadHighscore, deleteHighscore} from './backdrop/highscore.js';
import {makeGridLines} from './gridlines';
import {makeQueue, queuePush, queuePop, animateQueue, queueLength} from './ball/queue';
import {makeEntryLoader, animateEntryLoader, restartEntryLoader} from './ball/entryloader';
import {fetchTextureFromServer, Random, ratio, clamp, easeInOutSine, addResizeListener, pad, getImageData, formatTime} from './util.js';
import {init as initSlidestepper, animate as animateSlides, getStep, doBloom, doOrdinaryPhysics} from './slides/slidestepper.js';

const socket = ioClient("http://localhost:3000");

let camera;
let renderer;
let scene;
let orbitControls;

let timeStartMillis;
let timeRoundStartMillis;
let lastTimeMillis;
let heightfield;
let composer;
let isFreeCamera;
let boosters;
let queue;
let hasWon = false;
let hasLost = true;
let bodiesCenter = new THREE.Vector3(), lastBodiesCenter;
let timerElement = document.getElementById("timer");
let frameCounter = 0;
let speed;
let speedWarningTime = null;
let cameraZCoordinate = 330;
let goal;
let texture;
let guiCovers;
let glitchAnimationTime = 0;
const timeLimit = 32;

const cameraLookAt = new THREE.Vector3(-2, 47.5, 0);

const uniforms = {
	time: {value: 0.0},
};

socket.on('new image', (fileName)  => {
	queueImage(fileName);
})

socket.on('remove image', (fileName)  => {
	console.log("remove image IKKE IMPLEMENTERT")
})

const queueImage = function(fileName) {
    console.log(`Downloading new image: ${fileName}`);

    function onLoadCallback(textureWithImage) {
        const imagedata = getImageData(textureWithImage.image);
        const edgedata = analyzeImage(imagedata);
        texture.offset.set(
            edgedata.center.x - 0.5,
            edgedata.center.y - 0.5
        );

        const scale = Math.max(edgedata.size.x, edgedata.size.y);
        texture.repeat.set(scale, scale);

        texture.bodysize = edgedata.size
        texture.colorMix = edgedata.color;

        restartEntryLoader(texture, queueLength());

        setTimeout(() => {
            queuePush(texture);
            if ((hasWon || hasLost) && queueLength() == 1) {
                setTimeout(launchNextInQueue, 0);
            }
        }, 0);        
    }

	const texture = fetchTextureFromServer(`http://localhost:3000/${fileName}`, onLoadCallback);

    texture.flipY = false;
    texture.rotation = Math.PI/2;
    texture.center.set(0.5, 0.5);

    //const scale = 2;
    //texture.repeat.set(1/scale, 1/scale);

    texture.needsUpdate = true;
	texture.fileName = fileName;
}

const initAnimation = function(domNodeId, canvasId) {
    timeStartMillis = new Date().getTime();
    lastTimeMillis = timeStartMillis;

    renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.gammaInput = true;
    renderer.gammaOutput = true;
    renderer.setClearColor(new THREE.Color(0x1A1A1A));
    renderer.domElement.setAttribute('id', canvasId);
    renderer.setSize(window.innerWidth, window.innerHeight, true);
    renderer.setPixelRatio(window.devicePixelRatio || 1);

    const ratio = renderer.getContext().drawingBufferWidth / renderer.getContext().drawingBufferHeight;

    camera = new THREE.PerspectiveCamera(10, ratio, 0.01, 1e6);
    camera.updateProjectionMatrix();

    orbitControls = new THREE.OrbitControls( camera, renderer.domElement );
    orbitControls.target.copy(cameraLookAt);
    toggleFreeCamera();

    document.getElementById(domNodeId).appendChild(renderer.domElement);

    scene = new THREE.Scene();

    addResizeListener(camera, renderer);
    heightfield = makeHeightField();

    boosters = makeBoosters(heightfield);

    initPhysics(heightfield, boosters);
    makeContents();

    composer = setUpComposer(scene, camera, renderer);

    loadHighscore();
    refreshHighscore();
    setInterval(saveHighscore, 1000);

    //queueMockPlayers();
    //queueDebugHeads();
    queueMockPlayer();

    //camera.position.set(250, -100, 700);
    //orbitControls.target.copy(camera.position);
    //orbitControls.target.z = 0;

    initSlidestepper(scene);

    document.addEventListener("keypress", (event) => {
        if (event.key == "f") { // "f"
            //toggleFreeCamera();
        }
    })
}

function resetBall(texture) {
    console.log("Reset ball", texture.bodysize, texture.colorMix);
	resetPhysics(texture);
    for (const booster of boosters) {
        delete booster.time;
    }
    timeRoundStartMillis = new Date().getTime();
    hasWon = false;
    hasLost = false;
    speedWarningTime = null;
    glitchAnimationTime = 0;

    document.getElementById("died").classList.toggle("hidden", true);
    document.getElementById("glitched").classList.toggle("hidden", true);
    document.getElementById("highscore").classList.toggle("hidden", true);
}

export function toggleFreeCamera() {
    isFreeCamera = !isFreeCamera;
    if (isFreeCamera) {
        //camera.position.set(250, -100, 700);
        //orbitControls.target.copy(camera.position);
        //orbitControls.target.z = 0;
    }
}

function teleportPlayer() {
    const destination = goal.position.clone();
    destination.add(new THREE.Vector3(-12, 12, 0));
    teleportTo(destination);
}

function brakePlayer() {
    scaleVelocity(0.5);
}

function makeContents() {
    const nofCylinderBodies = getCylinderBodies().length;

    const cylinder = initBall(nofCylinderBodies);
    scene.add(cylinder);

    // Queue

    queue = makeQueue();
    queue.scale.multiplyScalar(0.007);
    scene.add(queue);

    // Line

    const lineThickness = 0.1;
    const lineMaterial = new THREE.MeshBasicMaterial({color: 0xff22ff});
    const lineGeometry = new THREE.PlaneBufferGeometry(1, lineThickness);
    lineGeometry.translate(0.5, 0, 0);
    const positions = [];

    const line = new THREE.Object3D();
    for (let i = 0; i < heightfield.length - 1; i++) {
        const x = i;
        const y = heightfield[i][0];

        const nextX = i+1;
        const nextY = heightfield[i+1][0];

        const segment = new THREE.Mesh(lineGeometry, lineMaterial);

        const diff = new THREE.Vector2(nextX, nextY).clone().sub(new THREE.Vector2(x, y));

        segment.rotation.z = diff.angle();
        segment.scale.multiplyScalar(diff.length());

        segment.position.set(x, y, 0);

        line.add(segment);
    }

    // Heightfield

    const hfBody = getHeightfieldBody();

    const hfBodyMesh = new THREE.Object3D();
    hfBodyMesh.add(line);
    hfBodyMesh.position.add(hfBody.position);
    hfBodyMesh.position.z -= 8/2;

    //scene.add(shape2mesh(hfBody)) // For debugging

    scene.add(hfBodyMesh);

    // Gridlines

    const gridLines = makeGridLines(heightfield);
    gridLines.position.set(0, hfBodyMesh.position.y, 0);
    scene.add(gridLines);

    // Backdrop

    //const backdrop = createBackdrop();
    const backdrop = createTexturedBackdrop();
    backdrop.scale.multiplyScalar(6);
    backdrop.position.set(50, 0, -100)
    //scene.add(backdrop);

    // Goal

    goal = new THREE.Object3D();
    scene.add(goal);
    goal.position.set(502, -248, 0);
    const goalLineGeometry = new THREE.CircleGeometry(1, 32);
    const goalLineMaterial = new THREE.MeshBasicMaterial({
        color: new THREE.Color(0xce5cf1),
        wireframe: false,
    })
    const goalLine = new THREE.Mesh(goalLineGeometry, goalLineMaterial);
    goalLine.scale.set(1, 8);
    goal.add(goalLine)

    // Boosters

    const boosterMeshes = makeBoosterMeshes();
    scene.add(boosterMeshes);

    // GUI Covers

    guiCovers = new THREE.Object3D();
    
    const leftMaterial = new THREE.MeshBasicMaterial({
        transparent: true, 
        map: fetchTextureFromServer(`http://localhost:3000/internal/gui-gradient.png`),
    });
    const leftRectangle = new THREE.Mesh(new THREE.PlaneBufferGeometry(2, 10), leftMaterial);
    leftRectangle.position.x = -1.65;
    //guiCovers.add(leftRectangle)


    const topMaterial = new THREE.MeshBasicMaterial({
        transparent: true, 
        map: fetchTextureFromServer(`http://localhost:3000/internal/glitch-logo.png`),
    });
    const topRectangle = new THREE.Mesh(new THREE.PlaneBufferGeometry(1.718, 1.122), topMaterial);
    topRectangle.scale.multiplyScalar(0.45);
    topRectangle.position.y = 1;
    guiCovers.add(topRectangle)

    guiCovers.scale.multiplyScalar(0.1);
    scene.add(guiCovers);

    // Entry loader

    const entryLoader = makeEntryLoader();
    entryLoader.position.set(0.8, 1.15, 0.1);
    guiCovers.add(entryLoader);

    cylinder.name = "ball";
    guiCovers.name = "guiCovers";
    boosterMeshes.name = "boosterMeshes";
    goal.name = "goal";
    gridLines.name = "gridLines";
    hfBodyMesh.name = "line";
    queue.name = "queue";
}

const animate = function() {
    requestAnimationFrame(animate);

    const timeMillis = new Date().getTime();
    const timeSeconds = (timeMillis - timeStartMillis) / 1000;

    const timeRoundSeconds = (timeMillis - timeRoundStartMillis) / 1000;

    const deltaSeconds = (timeMillis - lastTimeMillis) / 1000;
    lastTimeMillis = timeMillis;

    if (hasWon) {
        glitchAnimationTime += deltaSeconds;
    }

    const glitchAnimationSpeed = 12;
    const goalScale = clamp(1 - glitchAnimationTime * glitchAnimationSpeed, 0.01, 1);
    goal.scale.set(goalScale, goalScale, goalScale)

    if (!hasWon && !hasLost && doOrdinaryPhysics()) {
        lastBodiesCenter = bodiesCenter;
        bodiesCenter = updatePhysics(deltaSeconds);
        speed = lastBodiesCenter.distanceTo(bodiesCenter);

        updateCylinder(bodiesCenter, getCylinderBodies());
        updateBackdrop(deltaSeconds);
        updateBoosters(deltaSeconds);
    }

    orbitControls.update();

    if (!isFreeCamera) {
        const zoomOutSpeedSensitivity = 1;
        const zoomOutSpeedTippingPoint = 0.3;
        //cameraZCoordinate = clamp(cameraZCoordinate + (speed - zoomOutSpeedTippingPoint) * zoomOutSpeedSensitivity, 80, 160);
        //console.log(speed, cameraZCoordinate);

        cameraLookAt.set(bodiesCenter.x, bodiesCenter.y + 3, cameraLookAt.z);
        camera.position.set(cameraLookAt.x, cameraLookAt.y - 12, cameraZCoordinate)
        camera.lookAt(cameraLookAt)

        queue.position.copy(camera.position);
        queue.position.z -= 0.5;
        queue.position.y += 0.037;
        queue.position.x -= 0.0525;

        guiCovers.position.x = camera.position.x;
        guiCovers.position.y = camera.position.y;
        guiCovers.position.z = camera.position.z - 1;
    } else {
        camera.position.set(cameraLookAt.x + 30, cameraLookAt.y + 30, cameraLookAt.z + 120);
        camera.lookAt(cameraLookAt);
    }

    animateQueue(timeSeconds);
    animateEntryLoader(deltaSeconds);

    animateSlides(timeSeconds);
    
    if (doBloom()) {
        composer.render(1/60);
    } else {
        renderer.render(scene, camera);
    }

    let timeLeftSeconds = timeLimit - timeRoundSeconds;

    if (timeLeftSeconds <= 0 && !hasWon) {
        timeLeftSeconds = 0;
        loseRound();
    };

    if (!hasWon) timerElement.innerText = formatTime(timeLeftSeconds)

    const secondsLeftWarningLimit = 8;
    const timeLeftFactor = clamp((timeRoundSeconds - timeLimit + secondsLeftWarningLimit)/secondsLeftWarningLimit, 0, 1);
    const textColor = new THREE.Color("#fff");//.lerp(new THREE.Color("#3FFF5C"), timeLeftFactor);
    const textFrequency = 10;
    const sine = (Math.sin(timeRoundSeconds * textFrequency) + 1) / 2;
    textColor.lerp(new THREE.Color("#FF0000"), sine * timeLeftFactor);
    const textColorStr = textColor.getHexString();
    if (!hasWon && !hasLost) {
        timerElement.style = `
            color: #${textColorStr}; 
            text-shadow: 0 0 4px #${textColorStr}, 0 0 20px #${textColorStr};
            font-size: ${32 + timeLeftFactor * 50}px
        `;
    }

    if (bodiesCenter.x >= goal.position.x) {
        winRound(timeLeftSeconds);
    }

    const speedWarningLimit = 0.05;
    const speedWarningTimeLimitSeconds = 3;

    if (speed < speedWarningLimit) {
        if (speedWarningTime == null) {
            speedWarningTime = 0;
        }
        if (speedWarningTime != null) {
            speedWarningTime += deltaSeconds;
        }

        //console.log("SPEED WARNING", speed, speedWarningTime);

        if (speedWarningTime > speedWarningTimeLimitSeconds) {
            loseRound();
        }
    } else {
        speedWarningTime = null;
    }
}

function loseRound() {
    if (hasLost == false) {
        console.log("PLAYER LOST");
        document.getElementById("died").classList.toggle("hidden", false);
        //setTimeout(launchNextInQueue, 3000);
        //document.getElementById("highscore").classList.toggle("hidden", false);
    }
    hasLost = true;
}

function winRound(timeLeftSeconds) {
    function rankify(rank) {
        let adjustedRank = rank;

        if (rank > 20) {
            adjustedRank -= 10 * Math.floor(rank / 10);
        } 

        if (adjustedRank == 1) {
            return {number: rank, postfix: "st"}
        }
        if (adjustedRank == 2) {
            return {number: rank, postfix: "nd"}
        }
        if (adjustedRank == 3) {
            return {number: rank, postfix: "rd"}
        }

        return {number: rank, postfix: "th"}
    }

    if (!hasWon) {
        console.log("REACHED GOAL at", timeLeftSeconds);
        const rank = registerGoalTime(timeLeftSeconds, texture);
        setTimeout(() => {
            const rankified = rankify(rank);
            document.getElementById("rankNumber").innerText = rankified.number;
            document.getElementById("rankPostfix").innerText = rankified.postfix;
            document.getElementById("glitched").classList.toggle("hidden", false);
        }, 100);
        refreshHighscore();
        glitchBall();
        //setTimeout(launchNextInQueue, 3000);
        //document.getElementById("highscore").classList.toggle("hidden", false);
    }
    hasWon = true;
}

function queueMockPlayers() {
    for (let i = 0; i < 7; i++) {
        queueMockPlayer();
    }
    window.setTimeout(() => launchNextInQueue(), 1000); // For å rekke å laste tekstur
}

function queueMockPlayer() {
    window.i = window.i || 1;
    queueImage("internal/neonhead2.png")
    window.i = (window.i++ % 11) + 1; // 1, 2 ... 7, 8, 1, 2 ...
}

function queueDebugPlayer() {
    const debugHeads = [
        "internal/colorhead-RGB.png",
        "internal/colorhead-RG-.png",
        "internal/colorhead-R-B.png",
        "internal/colorhead--GB.png",
        "internal/colorhead-R--.png",
        "internal/colorhead--G-.png",
        "internal/colorhead---B.png",

        "internal/bluegreen1.png",
        "internal/crosshead1.png",
        "internal/lefthead1.png",
        "internal/bottomhead1.png",
        "internal/cornerhead1.png",
        "internal/tophead1.png",
        "internal/bighead1.png",
        "internal/smallhead1.png",
        "internal/diagonalhead1.png",
        "internal/neonhead1.png",
        "internal/neonhead2.png",
        "internal/neonhead3.png",
        "internal/testhead.png",
    ]

    window.j = window.j || 0;
    queueImage(debugHeads[window.j]);
    window.j = (window.j + 1) % debugHeads.length;

}

function queueDebugHeads() {
    const button = document.getElementById("queueDebug");
    for (let i = 0; i < 13+7; i++) {
        button.click();
    }
    window.setTimeout(() => document.getElementById("launchPlayer").click(), 1000); // For å rekke å laste tekstur
}

/*
function queueDebugHeads2() {
    queueImage("internal/scan1.png");
    queueImage("internal/scan2.png");
    queueImage("internal/scan3.png");
    queueImage("internal/scan4.png");
}
*/

function launchNextInQueue() {
    texture = queuePop();
    if (!texture) return;
    setMap(texture);
    resetBall(texture);
}

function deleteHighscoreAndRefresh() {
    deleteHighscore();
    refreshHighscore();
}

function refreshHighscore() {
    document.getElementById("highscore-lists").innerHTML = makeHighscoreHtml();
}

export default function main() {
	initAnimation("container", "renderer");


    lastBodiesCenter = bodiesCenter;
    bodiesCenter = updatePhysics(1/60);
    updateCylinder(bodiesCenter, getCylinderBodies());

	animate();
}
