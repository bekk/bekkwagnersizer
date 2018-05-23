THREE.OrbitControls = require('three-orbit-controls')(THREE);

import ioClient from 'socket.io-client';

import Bird from "./bird.js";
import RealtimeTextureCollection from "./realtime-texture-collection.js";
import { fetchTextureFromServer, Random } from './util.js';

const socket = ioClient("http://localhost:3000");

let timeStart;
let camera;
let renderer;
let scene;
let orbitControls;
let textureCollection;

// 256 stykker på 1024^2 ser ut til å være en øvre grense for rendringen nå
// eller overkant av 1000 stykker på 512^2
const nofTextures = 100;
const textureWidth = 512;
const textureHeight = 512;

let i = Math.floor(nofTextures * 2/3);

const uniforms = {
	time: {value: 0.0},
};

socket.on('new image', (fileName)  => {
	console.log(`Downloading new image: ${fileName}`);

	const texture = fetchTextureFromServer(`http://localhost:3000/${fileName}`);
	textureCollection.updateImage(texture, i++ % nofTextures);
})

window.setInterval(() => {
	const fileName = 'People_karakterer_mai-' + Random.int(0, 1) + Random.int(1, 9);
	const texture = fetchTextureFromServer(`http://localhost:3000/${fileName}.png`);
	textureCollection.updateImage(texture, textureCollection.getIndexInBack());
}, 1000);

const initAnimation = function(domNodeId, canvasId) {
	timeStart = new Date().getTime();

	renderer = new THREE.WebGLRenderer({antialias: false});
	renderer.gammaInput = true;
	renderer.gammaOutput = true;
	renderer.setClearColor(0xB0B0B0);
	renderer.domElement.setAttribute('id', canvasId);
	renderer.setSize(window.innerWidth, window.innerHeight, true);

	console.log(
		renderer.getContext().getParameter(renderer.getContext().MAX_VERTEX_TEXTURE_IMAGE_UNITS),
		renderer.getContext().getParameter(renderer.getContext().MAX_TEXTURE_SIZE),
	);

	const ratio = renderer.getContext().drawingBufferWidth / renderer.getContext().drawingBufferHeight;
	
	const cameraHeight = 0.4 ;
	camera = new THREE.PerspectiveCamera(45, ratio, 0.1, 10000);
	camera.position.set(0, cameraHeight, 2.55);
	camera.updateProjectionMatrix();

	orbitControls = new THREE.OrbitControls(camera);
	orbitControls.target = new THREE.Vector3(0, cameraHeight, 0);
	orbitControls.update();

	document.getElementById(domNodeId).appendChild(renderer.domElement);

	scene = new THREE.Scene();

	textureCollection = new RealtimeTextureCollection(nofTextures, textureWidth, textureHeight);
	scene.add(textureCollection);

	const purplePlane = new THREE.Mesh(
		new THREE.PlaneGeometry(5,2),
		new THREE.MeshBasicMaterial({color: new THREE.Color().setHSL(327/360, 0.89, 0.28)})
	);
	purplePlane.position.set(0, -0.5, 0.2);
	scene.add(purplePlane);

	var lightSun = new THREE.DirectionalLight(0xffffff, 1.0);
	lightSun.position.set(-0.5, 4, 1).normalize();
	scene.add(lightSun);

	addResizeListener(camera, renderer);
}

const addResizeListener = function(camera, renderer) {
	window.addEventListener('resize', function() {
		var height = window.innerHeight;
		renderer.setSize(window.innerWidth, height);
		camera.aspect = window.innerWidth / height;
		camera.updateProjectionMatrix();
	});
}

const animate = function() {
	requestAnimationFrame(animate);
	uniforms.time.value = (new Date().getTime() - timeStart) / 1000;

	orbitControls.update();

	textureCollection.updatePositions();
	
	renderer.render(scene, camera);
}

export default function main() {
	initAnimation("container", "renderer");
	animate();
}