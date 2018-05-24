THREE.OrbitControls = require('three-orbit-controls')(THREE);

import ioClient from 'socket.io-client';

import Bird from "./bird.js";
import { fetchTextureFromServer, Random, ratio } from './util.js';
import Manhattan from './manhattan-scene.js';
import People from './people-scene.js';

const socket = ioClient("http://localhost:3000");

let timeStart;
let camera;
let renderer;
let scene;
let orbitControls;
let textureCollection;
const animations = {};

const uniforms = {
	time: {value: 0.0},
};

socket.on('new image', (fileName)  => {
	console.log(`Downloading new image: ${fileName}`);

	const texture = fetchTextureFromServer(`http://localhost:3000/${fileName}`);
	animations.people.addTexture()
})

window.setInterval(() => {
	const fileName = 'People_karakterer_mai-' + Random.int(0, 1) + Random.int(1, 9);
	const texture = fetchTextureFromServer(`http://localhost:3000/${fileName}.png`);
	animations.people.addTexture(texture)
}, 1000);

const initAnimation = function(domNodeId, canvasId) {
	timeStart = new Date().getTime();

	renderer = new THREE.WebGLRenderer({antialias: true});
	renderer.gammaInput = false;
	renderer.gammaOutput = false;
	renderer.setClearColor(0x97eeff);
	renderer.domElement.setAttribute('id', canvasId);
	renderer.setSize(window.innerWidth, window.innerHeight, true);

	console.log(
		renderer.getContext().getParameter(renderer.getContext().MAX_VERTEX_TEXTURE_IMAGE_UNITS),
		renderer.getContext().getParameter(renderer.getContext().MAX_TEXTURE_SIZE),
	);

	document.getElementById(domNodeId).appendChild(renderer.domElement);

	animations.people = new People(renderer);
	animations.manhattan = new Manhattan(renderer);

	changeAnimation(animations.people)

	document.getElementById("manhattan").onclick = function() { 
		changeAnimation(animations.manhattan);
	};
	document.getElementById("people").onclick = function() { 
		changeAnimation(animations.people);
	};
}

const changeAnimation = function(animation) {
	scene = animation.scene
	camera = animation.camera;
}

const animate = function() {
	requestAnimationFrame(animate);
	uniforms.time.value = (new Date().getTime() - timeStart) / 1000;

	animations.people.animate();
	animations.manhattan.animate();
	
	renderer.render(scene, camera);
}

export default function main() {
	initAnimation("container", "renderer");
	animate();
}