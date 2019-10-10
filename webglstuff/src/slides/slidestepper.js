
import {makeContents} from './slidecontents.js';
import {fetchTextureFromServer, Random, ratio, clamp, easeInOutSine, addResizeListener, pad, getImageData, formatTime} from '../util.js';
import {initPhysics, updatePhysics, makeHeightField, getCylinderBodies, resetPhysics} from './slidephysics.js';
import {updateCylinder} from './slideball.js';
import {toggleFreeCamera} from '../main.js'; 

let step = 0;
let stepStartTime = new Date().getTime();
let scene;
let isBloomOn, doGlitchPhysics;

let htmlContainer;

export function init(sceneParam) {
    scene = sceneParam;

    document.addEventListener("keypress", (event) => {
        if (event.key == "r") {
            resetPhysics();
        } else {

            const now = new Date().getTime();
            
            const stepChangeFreezePeriod = 50;

            if (now - stepStartTime > stepChangeFreezePeriod) {
                step += 1;
                stepStartTime = now;
                doStep();
            }
        }
    })

    htmlContainer = document.createElement("div");
    const styleContainer = document.createElement("style");
    styleContainer.innerHTML = `
        .stepCounter {
            position: absolute;
            top: 2%;
            left: 2%;
            font-size: 32px;
        }
    `;
    document.body.appendChild(styleContainer)
    document.body.appendChild(htmlContainer);

    makeContents(scene);    

    isBloomOn = false;
    doGlitchPhysics = false;

    scene.getObjectByName("ball").visible = false;
    scene.getObjectByName("guiCovers").visible = false;
    scene.getObjectByName("boosterMeshes").visible = false;
    scene.getObjectByName("goal").visible = false;
    scene.getObjectByName("gridLines").visible = false;
    scene.getObjectByName("line").visible = false;
    scene.getObjectByName("queue").visible = false;
    
    scene.getObjectByName("step0").visible = false;
    scene.getObjectByName("step1").visible = false;

    document.getElementById("timer").classList.toggle("hidden", true);
    document.getElementById("queueTitle").classList.toggle("hidden", true);
    document.getElementById("queueOverflow").classList.toggle("hidden", true);
    document.getElementById("entryloaderText").classList.toggle("hidden", true);
    document.getElementById("cannon").classList.toggle("hidden", true);

    doStep();
}

export function animate(timeSeconds) {
    const bodiesCenter = updatePhysics();
    updateCylinder(bodiesCenter, getCylinderBodies())

    scene.getObjectByName("step0").animate(timeSeconds);
    scene.getObjectByName("step1").animate(timeSeconds);
}

export function getStep() {
    return step;
}

export function doBloom() {
    return isBloomOn;
}

export function doOrdinaryPhysics() {
    return doGlitchPhysics;
}

let timou = null;

function doStep() {
    htmlContainer.innerHTML = `
        <span class="stepCounter">step ${step}</span>
    `;

    resetPhysics();

    if (step === 0) {
        scene.getObjectByName("step0").visible = true;
        scene.getObjectByName("mediastream").visible = false;
        scene.getObjectByName("node").visible = false;

        document.getElementById("websockets").classList.toggle("hidden", true);
        document.getElementById("mediastream").classList.toggle("hidden", true);
        document.getElementById("wifi").classList.toggle("hidden", true);
        document.getElementById("usb").classList.toggle("hidden", true);
        document.getElementById("node").classList.toggle("hidden", true);
    }
    if (step === 1) {
        scene.getObjectByName("mediastream").visible = true;
        document.getElementById("usb").classList.toggle("hidden", false);
        document.getElementById("mediastream").classList.toggle("hidden", false);
    }
    if (step === 2) {
        scene.getObjectByName("node").visible = true;
        document.getElementById("wifi").classList.toggle("hidden", false);
        document.getElementById("node").classList.toggle("hidden", false);
        document.getElementById("websockets").classList.toggle("hidden", false);
    }
    if (step === 3) {
        document.getElementById("node").classList.toggle("hidden", true);
        document.getElementById("websockets").classList.toggle("hidden", true);
        document.getElementById("mediastream").classList.toggle("hidden", true);

        document.getElementById("cannon").classList.toggle("hidden", false);
        scene.getObjectByName("step0").visible = false;
        scene.getObjectByName("step1").visible = true;
        scene.getObjectByName("hfBodyDebugMesh").visible = true;
        scene.getObjectByName("rigidBall").visible = true;
        scene.getObjectByName("bouncyBall").visible = false;
    }
    if (step === 4) {
        document.getElementById("cannon").classList.toggle("hidden", true);
        scene.getObjectByName("rigidBall").visible = false;
        scene.getObjectByName("bouncyBall").visible = true;
    }
    if (step === 5) {
        scene.getObjectByName("ballMesh").visible = true;
    }
    if (step === 6) {
        toggleFreeCamera();
        scene.getObjectByName("step1").visible = false;
        scene.getObjectByName("ball").visible = true;
        scene.getObjectByName("goal").visible = true;
        scene.getObjectByName("line").visible = true;
        scene.getObjectByName("gridLines").visible = true;
    }
    if (step === 7) {
        scene.getObjectByName("boosterMeshes").visible = true;
    }
    if (step === 8) {
        isBloomOn = true;
    }
    if (step === 9) {
        scene.getObjectByName("guiCovers").visible = true;
        scene.getObjectByName("queue").visible = true;

        document.getElementById("timer").classList.toggle("hidden", false);
        document.getElementById("queueTitle").classList.toggle("hidden", false);
        document.getElementById("queueOverflow").classList.toggle("hidden", false);
        document.getElementById("entryloaderText").classList.toggle("hidden", false);
    }
    if (step === 10) {
        doGlitchPhysics = true;
    }
}