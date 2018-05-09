THREE.OrbitControls = require('three-orbit-controls')(THREE);

import Bird from "./bird.js";
import RealtimeTextureCollection from "./realtime-texture-collection.js";

let timeStart;
let camera;
let renderer;
let scene;
let orbitControls;
let i = 0;

const uniforms = {
	time: {value: 0.0},
};

const initAnimation = function(domNodeId, canvasId) {
	timeStart = new Date().getTime();

	renderer = new THREE.WebGLRenderer({antialias: true});
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
	
	camera = new THREE.PerspectiveCamera(45, ratio, 0.1, 10000);
	camera.position.set(0.15, 0.25, 0.7).multiplyScalar(12);
	camera.updateProjectionMatrix();

	orbitControls = new THREE.OrbitControls(camera);
	orbitControls.target = new THREE.Vector3(0, 0, 0);
	orbitControls.update();

	document.getElementById(domNodeId).appendChild(renderer.domElement);

	scene = new THREE.Scene();

	const bird = new Bird();
	window.bird = bird;
	scene.add(bird);

	// 256 stykker på 1024^2 ser ut til å være en øvre grense for rendringen nå
	// eller overkant av 1000 stykker på 512^2
	const nofTextures = 16;
	const textureWidth = 512;
	const textureHeight = 512;

	const textureCollection = new RealtimeTextureCollection(nofTextures, textureWidth, textureHeight);
	window.textureCollection = textureCollection;
	scene.add(textureCollection);
	textureCollection.position.set(0, 0, 0);

	function fetchImageFromServer(filename, callback, errorCallback) {
		const loader = new THREE.TextureLoader();
		const url = `http://localhost:3000/${filename}`;

		return loader.load(
			url,

			function onLoad(image) {
				callback(image);
			},

			function onProgress() {

			},

			function onError(err) {
				console.error('Could not load texture from server', url);
				if (errorCallback) errorCallback(err);
			}
		);
	}

	const filenames = ['snowman.png', 'bird.png', 'pikachu.png', 'hulk.png', 'troll.png'];

	setInterval(() => {
		const texture = fetchImageFromServer(filenames[i % filenames.length], (image) => {});
		textureCollection.updateImage(texture, i++ % nofTextures);
	}, 2000);

	var lightSun = new THREE.DirectionalLight(0xffffff, 1.0);
	lightSun.position.set(-0.5, 4, 1).normalize();
	scene.add(lightSun);

	var lightAmbient = new THREE.DirectionalLight(0xffffff, 0.25);
	lightAmbient.position.copy(lightAmbient.position).negate();
	scene.add(lightAmbient);

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
	
	window.bird.flapWings(uniforms.time.value);
	
	renderer.render(scene, camera);
}

export default function main() {
	initAnimation("container", "renderer");
	animate();
}