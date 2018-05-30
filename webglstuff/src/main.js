THREE.OrbitControls = require('three-orbit-controls')(THREE);

import ioClient from 'socket.io-client';

import Bird from "./bird.js";
import { fetchTextureFromServer, Random, ratio, clamp, easeInOutSine } from './util.js';
import Manhattan from './manhattan.js';
import People from './people.js';
import Telly from './telly.js';
import RealtimeTextureCollection from "./realtime-texture-collection.js";
import PlingPlongTransition from "./pling-plong-transition.js";

const socket = ioClient("http://localhost:3000");

let timeStart;
let camera;
let renderer;
let scene;
let orbitControls;
let textureCollection;
const animations = {};
let realtimeTextureCollection;

let otherCamera;
let otherScene;
let transition;

const uniforms = {
	time: {value: 0.0},
};

socket.on('new image', (fileName)  => {
	console.log(`Downloading new image: ${fileName}`);
	addImage(fileName.replace('.png', ''));
})

window.setInterval(() => {
	//const fileName = 'People_karakterer_mai-' + Random.int(0, 1) + Random.int(1, 9);
	const sex = Random.pick(["male", "female"]);
	
	let fileName;
	
	if (sex == "female") {
		fileName = 'hode-f-' + Random.int(1, 4);
	} else {
		fileName = 'hode-m-' + Random.int(1, 20);
	}

	addImage(fileName, sex);
}, 1000);

const addImage = function(fileName, sex) {
	const texture = fetchTextureFromServer(`http://localhost:3000/${fileName}.png`);
    //realtimeTextureCollection.updateImage(texture);
	animations.people.updateImage(texture, sex);
	animations.manhattan.updateImage(texture, sex);
	animations.telly.updateImage(texture, sex);
}

const initAnimation = function(domNodeId, canvasId) {
	timeStart = new Date().getTime();

	renderer = new THREE.WebGLRenderer({antialias: true});
	renderer.gammaInput = false;
	renderer.gammaOutput = false;
	renderer.setClearColor(0x000000);
	renderer.domElement.setAttribute('id', canvasId);
	renderer.setSize(window.innerWidth, window.innerHeight, true);
	renderer.autoClear = false;

	console.log(
		renderer.getContext().getParameter(renderer.getContext().MAX_VERTEX_TEXTURE_IMAGE_UNITS),
		renderer.getContext().getParameter(renderer.getContext().MAX_TEXTURE_SIZE),
	);

	document.getElementById(domNodeId).appendChild(renderer.domElement);

    // 256 stykker på 1024^2 ser ut til å være en øvre grense for rendringen nå
    // eller overkant av 1000 stykker på 512^2
    const nofTextures = 400;
    const textureWidth = 512;
    const textureHeight = 512;
	realtimeTextureCollection = new RealtimeTextureCollection(nofTextures, textureWidth, textureHeight);

	animations.people = new People(renderer, realtimeTextureCollection);
	animations.manhattan = new Manhattan(renderer, realtimeTextureCollection);
	animations.telly = new Telly(renderer, realtimeTextureCollection);

	changeAnimation(animations.people)

	// TODO: Skift til 12.3 * 7, x * y piksler

	// Sjekk ytelsen om bildene er 1024^2. Det blir litt stygt når zoomet ut nå

	document.getElementById("manhattan").onclick = function() { 
		changeAnimation(animations.manhattan);
	};
	document.getElementById("people").onclick = function() { 
		changeAnimation(animations.people);
	};
	document.getElementById("telly").onclick = function() { 
		changeAnimation(animations.telly);
	};
	document.getElementById("zoomOut").onclick = function() { 
		zoomOut();
	};
	document.getElementById("zoomIn").onclick = function() { 
		zoomIn();
	};

        otherCamera = new THREE.PerspectiveCamera(45, ratio(renderer), 0.01, 10000);
        otherCamera.position.set(0, 0, 3);
        otherCamera.updateProjectionMatrix();

        otherScene = new THREE.Scene();
        transition = new PlingPlongTransition(otherCamera);
        otherScene.add(transition);
}
		
		window.state = 0;
		window.transitionStartTime = 0;

const changeAnimation = function(animation) {
	scene = animation.scene
	camera = animation.camera;
}

const zoomOut = function() {
	window.state = 1;
	window.transitionStartTime = new Date().getTime();
}

const zoomIn = function() {
	window.state = 3;
	window.transitionStartTime = new Date().getTime();
}

const animate = function() {
	requestAnimationFrame(animate);
	uniforms.time.value = (new Date().getTime() - timeStart) / 1000;

	animations.people.animate();
	animations.manhattan.animate();
	animations.telly.animate();;

	    let normalizedZoom;
	    let speed = 0.5;
	    if (window.state == 1) {
	    	const timeDiff = (new Date().getTime() - window.transitionStartTime) / 1000;
	    	const eased = easeInOutSine(clamp(timeDiff * speed, 0, 1));
	    	normalizedZoom = 1 - eased;
	    	if (eased == 1) window.state = 2;
	    } else if (window.state == 3) {
	    	const timeDiff = (new Date().getTime() - window.transitionStartTime) / 1000;
	    	const eased = easeInOutSine(clamp(timeDiff * speed, 0, 1));
	    	normalizedZoom = eased;
	    	if (eased == 1) window.state = 0;
	    } else if (window.state == 2) {
			normalizedZoom = 0;
	    } else {
	    	normalizedZoom = 1;
	    }

		transition.animate(normalizedZoom);
		animations.people.zoomAmount(normalizedZoom);
		animations.manhattan.zoomAmount(normalizedZoom);
		animations.telly.zoomAmount(normalizedZoom);
	
	renderer.clear();
	renderer.render(scene, camera);

	renderer.clearDepth();
	renderer.render(otherScene, otherCamera);
}

export default function main() {
	initAnimation("container", "renderer");
	animate();
}