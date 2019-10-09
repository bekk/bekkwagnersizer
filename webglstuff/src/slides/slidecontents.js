
import {fetchTextureFromServer, Random, ratio, clamp, easeInOutSine, addResizeListener, pad, getImageData, formatTime} from '../util.js';
import {analyzeImage} from '../edgedetection';
import {initBall, updateCylinder, setMap} from './slideball.js';
import {initPhysics, updatePhysics, makeHeightField} from './slidephysics.js';
import shape2mesh from "../shape2mesh.js";

let sheetMaterial;

export function makeContents(scene) {
    const light = new THREE.DirectionalLight(0xffffff, 1.0);
    light.position.set(1, 3, 2);
    scene.add(light);


    function onLoadCallback(textureWithImage) {
        const imagedata = getImageData(textureWithImage.image);
        const edgedata = analyzeImage(imagedata);
        texture.offset.set(
            edgedata.center.x - 0.5,
            edgedata.center.y - 0.25
        );

        let scale = Math.max(edgedata.size.x, edgedata.size.y);
        scale *= 1.5;
        texture.repeat.set(scale, scale);

        texture.bodysize = edgedata.size
        texture.colorMix = edgedata.color;

        sheetMaterial.map = texture;
        sheetMaterial.needsUpdate = true;

        setMap(texture);
    }

    const texture = fetchTextureFromServer(`http://localhost:3000/internal/neonhead2.png`, onLoadCallback);

    const group = new THREE.Object3D();
    group.add(step0(scene));
    group.add(step1(scene));

    group.position.set(-5, 45, 0);

    scene.add(group);

    const hfBody = initPhysics(makeHeightField());
    const hfBodyDebugMesh = shape2mesh(hfBody);
    scene.add(hfBodyDebugMesh);

    const ballMesh = initBall(12);
    scene.add(ballMesh);
}

function step0() {
    const step0 = new THREE.Object3D();
    step0.name = "step0";
    const blackMaterial = new THREE.MeshLambertMaterial({
        color: new THREE.Color(0xffffff).multiplyScalar(0.25)
    });
    sheetMaterial = new THREE.MeshLambertMaterial({
        map: null,
        transparent: true,
    });
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(3.25, 3.25, 0.1, 40), blackMaterial);
    step0.add(plate);
    
    const sheet = new THREE.Object3D();
    const drawing = new THREE.Mesh(new THREE.PlaneGeometry(3, 3), sheetMaterial);
    const white = new THREE.Mesh(new THREE.PlaneGeometry(3, 4.2), new THREE.MeshLambertMaterial());
    white.position.z -= 0.02;
    sheet.add(drawing);
    sheet.add(white);
    sheet.rotation.x = -Math.PI/2;
    sheet.position.y = 0.15;
    step0.add(sheet);

    step0.animate = function(timeSeconds) {
        const amp = 3.5;
        const speed = 2.0;
        sheet.position.z = amp - clamp(Math.sin(timeSeconds * speed) * amp * 1.05, -amp, amp);
    }

    return step0;
}

function step1(scene) {
    const step1 = new THREE.Object3D();
    step1.name = "step1";
    const ground = new THREE.Mesh(new THREE.BoxGeometry(10, 1, 10), new THREE.MeshLambertMaterial());
    step1.add(ground);

    step1.animate = function(timeSeconds) {

    }

    return step1;
}



