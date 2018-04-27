THREE.OrbitControls = require('three-orbit-controls')(THREE);

import createBird from "./bird.js";

let timeStart;
let camera;
let renderer;
let scene;
let orbitControls;

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

	const ratio = renderer.getContext().drawingBufferWidth / renderer.getContext().drawingBufferHeight;
	
	camera = new THREE.PerspectiveCamera(45, ratio, 0.1, 10000);
	camera.position.set(1.4, 1.5, 0.7)
	camera.updateProjectionMatrix();

	orbitControls = new THREE.OrbitControls(camera);
	orbitControls.target = new THREE.Vector3(0, 1, 0);
	orbitControls.update();

	document.getElementById(domNodeId).appendChild(renderer.domElement);

	scene = new THREE.Scene();

	const bird = createBird();
  window.bird = bird;
	scene.add(bird);
	
	//scene.add(new THREE.Mesh(new THREE.BoxGeometry(1,1,1), new THREE.MeshStandardMaterial()));

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