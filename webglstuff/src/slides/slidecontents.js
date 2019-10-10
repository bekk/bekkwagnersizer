
import {fetchTextureFromServer, Random, ratio, clamp, easeInOutSine, addResizeListener, pad, getImageData, formatTime} from '../util.js';
import {analyzeImage} from '../edgedetection';
import {initBall, updateCylinder, setMap} from './slideball.js';
import {initPhysics, updatePhysics, makeHeightField, resetPhysics, getRigidBody} from './slidephysics.js';
import shape2mesh from "../shape2mesh.js";

let sheetMaterial;

export function makeContents(scene) {
    const light = new THREE.DirectionalLight(0xffffff, 1.0);
    light.position.set(3, 5, 2);
    scene.add(light);


    function onLoadCallback(textureWithImage) {
        const imagedata = getImageData(textureWithImage.image);
        const edgedata = analyzeImage(imagedata);
        texture.offset.set(
            edgedata.center.x - 0.35,
            edgedata.center.y - 0.125
        );

        let scale = Math.max(edgedata.size.x, edgedata.size.y);
        scale *= 1.0;
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
    group.add(step1and2(scene));

    group.position.set(-5, 45, 0);

    scene.add(group);
}

function step0() {
    const step0 = new THREE.Object3D();
    step0.name = "step0";

    const blackMaterial = new THREE.MeshLambertMaterial({
        color: new THREE.Color(0xffffff).multiplyScalar(0.25)
    });
    const greyMaterial = new THREE.MeshLambertMaterial({
        color: new THREE.Color(0xffffff).multiplyScalar(0.75)
    });

    sheetMaterial = new THREE.MeshLambertMaterial({
        map: null,
        transparent: true,
    });


    const scanner = new THREE.Object3D();

    const plate = new THREE.Mesh(new THREE.CylinderGeometry(3.25, 3.25, 0.1, 40), blackMaterial);
    scanner.add(plate);

    const stick = new THREE.Mesh(new THREE.BoxGeometry(0.65, 6.5, 0.45), blackMaterial);
    stick.rotation.z = 0.37;
    stick.position.set(1.75, 2.9, 0);
    scanner.add(stick);

    const smallPate = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.2, 40), blackMaterial);
    smallPate.position.set(0, 6, 0);
    scanner.add(smallPate);
    
    const sheet = new THREE.Object3D();
    const drawing = new THREE.Mesh(new THREE.PlaneGeometry(3, 3), sheetMaterial);
    const white = new THREE.Mesh(new THREE.PlaneGeometry(3, 4.2), new THREE.MeshLambertMaterial());
    white.position.z -= 0.02;
    sheet.add(drawing);
    sheet.add(white);
    sheet.rotation.x = -Math.PI/2;
    sheet.position.y = 0.15;
    scanner.add(sheet);

    scanner.position.x = -7;

    step0.add(scanner);

    const laptop = makeLaptop();
    laptop.scale.multiplyScalar(5);
    laptop.position.set(3, 0, 0);
    const cable = new THREE.Mesh(new THREE.TorusGeometry(2, 0.03, 10, 10, Math.PI*0.25), new THREE.MeshLambertMaterial())
    cable.scale.multiplyScalar(0.55);
    cable.position.set(-0.95, -1.03, 0);
    cable.rotation.z = Math.PI * (0.5 - 0.25/2);
    laptop.add(cable);
    laptop.name = "mediastream";
    step0.add(laptop);


    const laptop2 = makeLaptop();
    laptop2.scale.multiplyScalar(5);
    laptop2.position.set(12, 0, 0);
    for (let i = 0; i < 4; i++) {
        const arc = 0.1 + 0.05*i;
        const cable2 = new THREE.Mesh(new THREE.TorusGeometry(2 - (4-i)*0.1, 0.03, 10, 10, Math.PI*arc), new THREE.MeshLambertMaterial())
        cable2.scale.multiplyScalar(0.55);
        cable2.position.set(-1.9 + i*0.05, 0, 0);
        cable2.rotation.z = Math.PI * (0.5 - arc/2 - 0.5);
        laptop2.add(cable2);
    }
    laptop2.name = "node";
    step0.add(laptop2);

    for (let i = 0; i < 3; i++) {
        const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.07, 40), greyMaterial);
        disc.position.set(1, i*0.09, 0);
        laptop2.add(disc);
    }

    step0.animate = function(timeSeconds) {
        const amp = 3.5;
        const speed = 2.0;
        sheet.position.z = amp - clamp(Math.sin(timeSeconds * speed) * amp * 1.05, -amp, amp);
    }

    return step0;
}

function step1and2(scene) {
    const step1 = new THREE.Object3D();
    step1.name = "step1";
    const ground = new THREE.Mesh(new THREE.BoxGeometry(10, 1, 10), new THREE.MeshLambertMaterial());
    step1.add(ground);

    const rigidGeometry = new THREE.CylinderGeometry(4, 4, 1.5, 12);
    //rigidGeometry.rotateX(Math.PI/2);
    const rigid = new THREE.Mesh(rigidGeometry, new THREE.MeshBasicMaterial({wireframe: true}));
    rigid.name = "rigidBall";
    step1.add(rigid);

    const hfBody = initPhysics(makeHeightField());
    const hfBodyDebugMesh = shape2mesh(hfBody);
    hfBodyDebugMesh.name = "hfBodyDebugMesh";
    step1.add(hfBodyDebugMesh);

    const ballMesh = initBall(12);
    ballMesh.name = "bouncyBall";
    step1.add(ballMesh);
    step1.position.sub(new THREE.Vector3(-5, 45, 0));

    step1.animate = function(timeSeconds) {
        const rigidBody = getRigidBody();
        rigid.position.copy(rigidBody.position);
        rigid.setRotationFromQuaternion(rigidBody.quaternion);
    }

    return step1;
}

function makeLaptop() {
    var frameGeometry = new THREE.BoxGeometry(1, 0.05, 0.6);
    var frameMaterial = new THREE.MeshLambertMaterial({color: 0xFFFFFF});
    var frame = new THREE.Mesh(frameGeometry, frameMaterial);

    var lcdGeometry = new THREE.BoxGeometry(1*0.935, 0.05, 0.6*0.935);
    var lcdMaterial = new THREE.MeshLambertMaterial({color: 0x888888});
    var lcd = new THREE.Mesh(lcdGeometry, lcdMaterial);
    lcd.position.set(0, 0.02, 0);

    var screen = new THREE.Object3D();
    screen.add(frame);
    screen.add(lcd);
    screen.position.set(0, 0.3, -0.42);
    screen.rotation.set(Math.PI/2*0.75, 0, 0);

    var baseGeometry = new THREE.BoxGeometry(1, 0.05, 0.6);
    var baseMaterial = new THREE.MeshLambertMaterial({color: 0xFFFFFF});
    var base = new THREE.Mesh(baseGeometry, baseMaterial);

    var keyboard = new THREE.Object3D();
    var keyGeometry = new THREE.BoxGeometry(0.6/4*0.49, 0.05, 1/10*0.49);
    var keyMaterial = new THREE.MeshLambertMaterial({color: 0x888888});
    for (var x = 0; x < 10; x++) {
        for (var y = 0; y < 4; y++) {
            var key = new THREE.Mesh(keyGeometry, keyMaterial);
            key.position.set(x/11 - 0.4, 0.01, y/4*0.3 - 0.2);
            keyboard.add(key);
        }
    }

    var laptop = new THREE.Object3D();
    laptop.add(screen);
    laptop.add(base);
    laptop.add(keyboard);

    return laptop;
}


