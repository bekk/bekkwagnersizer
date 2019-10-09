
import CANNON from 'cannon';

const ballStartPosition = new CANNON.Vec3(-3, 55, 0);

let world, hfBody, bodies, boosters;
let rigidBody;
let ballConstraints = [];
let bodiesCenter;
let bodysize;
let colorMix;

const globalBallScale = 2.0;

export function initPhysics(heightfield) {
    // Init world
    world = new CANNON.World();
    world.gravity.set(1, -10, 0);
    world.broadphase = new CANNON.NaiveBroadphase();

    const granularity = 1;

    const CYLINDERGROUP = 1;
    const HFGROUP = 2;
    const EXTRAGROUP = 3;

    const cylinderMaterial = new CANNON.Material();
    cylinderMaterial.friction = 0;

    const heightfieldReduced = heightfield.filter((element, i) => i % granularity == 0);

    // Create the heightfields
    const hfShape = new CANNON.Heightfield(heightfieldReduced, {
        elementSize: granularity
    });
    
    hfShape.material = cylinderMaterial;
    
    hfBody = new CANNON.Body({ mass: 0, collisionFilterGroup: HFGROUP, collisionFilterMask: CYLINDERGROUP });
    hfBody.addShape(hfShape);
    hfBody.position.set(-heightfield.length/2, -255, heightfield[0].length/2);
    hfBody.position.vadd(new CANNON.Vec3(heightfield.length/2 - 10, 0, 0), hfBody.position);
    hfBody.quaternion.setFromEuler(-Math.PI/2, 0, 0);
    world.addBody(hfBody);

    // Add cylinders
    const mass = 1;
    const nofSpheres = 12;
    bodies = [];
    for (let i = 0; i < nofSpheres; i++) {
        const sphereShape = new CANNON.Cylinder(0.4, 0.4, 1.5, 3);
        
        sphereShape.transformAllPoints(CANNON.Vec3.ZERO, new CANNON.Quaternion().setFromEuler(Math.PI/2, 0, 0))

        sphereShape.material = cylinderMaterial;

        const sphereBody = new CANNON.Body({ mass: mass, collisionFilterGroup: CYLINDERGROUP, collisionFilterMask: HFGROUP});
        sphereBody.addShape(sphereShape); // TODO: Skal det heller være 1 body for alle cylinders med dem som shapes?
        sphereBody.quaternion.setFromEuler(-Math.PI/2, 0, 0);

        world.addBody(sphereBody);

        bodies.push(sphereBody);
    }

    const cylinderShape = new CANNON.Cylinder(4, 4, 10, 12);
    cylinderShape.transformAllPoints(CANNON.Vec3.ZERO, new CANNON.Quaternion().setFromEuler(Math.PI/2, 0, 0))
    cylinderShape.material = cylinderMaterial;
    rigidBody = new CANNON.Body({ mass: mass, collisionFilterGroup: EXTRAGROUP, collisionFilterMask: HFGROUP});
    rigidBody.addShape(cylinderShape);
    rigidBody.quaternion.setFromEuler(-Math.PI/2, 0, 0);
    world.addBody(rigidBody);

    resetPhysics();

    return hfBody;
};

// TODO: Bør innkaplset vekk fra utsiden
export function getHeightfieldBody() {
    return hfBody;
}

export function getCylinderBodies() {
    return bodies;
}

export function getRigidBody() {
    return rigidBody;
}

export function resetPhysics(textureParam) {
    world.clearForces();

    if (!textureParam) {
        bodysize = new THREE.Vector2(1, 1);
        colorMix = new THREE.Vector3(1, 1, 1);
    } else {
        bodysize = textureParam.bodysize;
        colorMix = textureParam.colorMix;
    }

    const nofSpheres = bodies.length;

    for (let i = 0; i < nofSpheres; i++) {
        const sphereBody = bodies[i];

        sphereBody.velocity.set(0, 0, 0);

        if (sphereBody.initAngularVelocity){
            sphereBody.angularVelocity.copy(sphereBody.initAngularVelocity);
            sphereBody.quaternion.copy(sphereBody.initQuaternion);
        }

        sphereBody.position.set(Math.sin(i/nofSpheres * Math.PI*2), Math.cos(i/nofSpheres * Math.PI*2), 0);

        const normI = (i - nofSpheres/4)/nofSpheres;

        /*
        sphereBody.position.scale(
            2 + Math.sin(normI * Math.PI*2 * 3) * 0.2,
            sphereBody.position
        );
        */
        const scale = Math.max(bodysize.x, bodysize.y) * globalBallScale;

        sphereBody.position.scale(scale, sphereBody.position);

        // Former spherebody LITT etter bodysize
        // TODO: Må skalere textur i samme mengde også
        sphereBody.position.x *= 1 + bodysize.x * 0.85;
        sphereBody.position.y *= 1 + bodysize.y * 0.85;

        sphereBody.position.vadd(
            ballStartPosition,
            sphereBody.position
        );

        rigidBody.velocity.set(0, 0, 0);
        rigidBody.angularVelocity.set(0, 0, 0)
        rigidBody.quaternion.copy(rigidBody.initQuaternion);
        rigidBody.position.copy(ballStartPosition)
    }

    resetBallConstraints(nofSpheres, bodysize);
}

export function resetBallConstraints(nofSpheres, bodysize) {
    for (const ballConstraint of ballConstraints) {
        world.removeConstraint(ballConstraint);
    }
    ballConstraints = [];

    for (let i = 0; i < nofSpheres; i++) {
        const sphereBody = bodies[i];
        const lastSphereBody = i > 0 ? bodies[i - 1] : bodies[bodies.length - 1];
        
        const bodyA = lastSphereBody;
        const bodyB = sphereBody;
        const pivotA = new CANNON.Vec3();
        const pivotB = new CANNON.Vec3();
        const halfWay = new CANNON.Vec3();
        bodyA.position.vadd(bodyB.position, halfWay);
        halfWay.scale(0.5, halfWay);
        bodyB.pointToLocalFrame(halfWay, pivotB);
        bodyA.pointToLocalFrame(halfWay, pivotA);

        // Antall iterations i solveren gjør at lock-constraint blir stivere
        //const joint = new CANNON.ConeTwistConstraint(lastSphereBody, sphereBody, {pivotA: pivotA, pivotB: pivotB, axisA: CANNON.Vec3.UNIT_Y, axisB: CANNON.Vec3.UNIT_Y, angle: 0, twistAngle: 0.1 });
        //const joint = new CANNON.HingeConstraint(lastSphereBody, sphereBody, {pivotA: pivotA, pivotB: pivotB, axisA: CANNON.Vec3.UNIT_Y, axisB: CANNON.Vec3.UNIT_Y });
        //const joint = new CANNON.PointToPointConstraint(lastSphereBody, CANNON.Vec3.ZERO, sphereBody, CANNON.Vec3.ZERO);
        const joint = new CANNON.LockConstraint(lastSphereBody, sphereBody, {maxForce: 1e12, collideConnected: false});
        /*const joint = new CANNON.ConeTwistConstraint(lastSphereBody, sphereBody, {
            pivotA: new CANNON.Vec3(0.4, 0, 0),
            pivotB: new CANNON.Vec3(-0.4, 0, 0),
            axisA: CANNON.Vec3.UNIT_Z,
            axisB: CANNON.Vec3.UNIT_Z,
            angle: Math.PI / 4,
            twistAngle: Math.PI / 4
        });
        */

        world.addConstraint(joint);
        ballConstraints.push(joint);
    }

    // Forsterknings-ledd:
    for (let i = 0; i < nofSpheres; i+=4) {
        const joint = new CANNON.LockConstraint(bodies[i], bodies[(i+nofSpheres/2) % nofSpheres]);
        //world.addConstraint(joint);
        //ballConstraints.push(joint);
    }
}

export function updatePhysics(dtSeconds) {
    const fixedTimeStep = 1/60;
    const maxSubSteps = 2;

    world.step(fixedTimeStep, dtSeconds, maxSubSteps);

    const nofSpheres = bodies.length;

    bodiesCenter = new THREE.Vector3();

    for (let i = 0; i < nofSpheres; i++) {
        const body = bodies[i];
        body.position.z = 0;

        bodiesCenter.add(body.position);
    }

    bodiesCenter.multiplyScalar(1/bodies.length);
    bodiesCenter.z = 0;

    const collapseAvoidanceStrength = 0.5;

    let collapsed = false;

    for (let i = 0; i < nofSpheres; i++) {
        const body = bodies[i];
        
        const nextI = (i + 1) % nofSpheres
        const nextBody = bodies[nextI];
        const threshold = 1;
        const distance = nextBody.position.distanceTo(body.position);
        if (distance < threshold) {
            const radiusVector = new CANNON.Vec3();
            body.position.vsub(bodiesCenter, radiusVector);
            radiusVector.scale(collapseAvoidanceStrength, radiusVector);
            
            //body.position.vadd(radiusVector, body.position);
            //console.log(radiusVector);
            collapsed = true;

        }
    }

    if (collapsed) {
        //resetBallConstraints(nofSpheres, bodysize);
    }

    const scale = Math.max(bodysize.x, bodysize.y) * globalBallScale;

    const bodiesCenterAdjusted = bodiesCenter.clone();

    return bodiesCenter;
}

export function teleportTo(destination) {
    const nofSpheres = bodies.length;

    for (let i = 0; i < nofSpheres; i++) {
        const sphereBody = bodies[i];

        const travelDiff = destination.clone().sub(bodiesCenter);

        sphereBody.position.vadd(
            travelDiff,
            sphereBody.position
        );
    }

}

export function scaleVelocity(factor) {
    for (const sphereBody of bodies) {
        sphereBody.velocity.scale(factor, sphereBody.velocity);
    }

}

export function makeHeightField() {
    // Create a heightfield of height values
    const heights = [];

    function makeJump(fromI) {
        const jumpLength = 30;
        const jumpHeight = 4;

        const startHeight = heights[fromI];
        const endHeight = heights[fromI + jumpLength] + jumpHeight;
        const diff = startHeight - endHeight;

        function downSteepStart(x) {
            return Math.sin(Math.PI/2 * x - Math.PI) + 1;
        }

        for (let i = 0; i < jumpLength; i++) {
            const ratio = i / (jumpLength - 1);
            heights[fromI + i] = startHeight - (diff * (1 - downSteepStart(ratio)));
        }

        return fromI + jumpLength;
    };

    function makeValley(fromI) {
        const valleyLength = 80;
        const valleyHeight = 50;

        const halfLength = Math.floor(valleyLength*3/4);

        const startHeight = heights[fromI];
        const middleHeight = startHeight - valleyHeight;
        const endHeight = heights[fromI + valleyLength];

        const valleyHeightAfterMiddle = endHeight - middleHeight;

        const diff = startHeight - endHeight;

        function downSteepMiddle(x) {
            return Math.sin(x * Math.PI + Math.PI/2) / 2 + 1/2;
        }

        for (let i = 0; i < halfLength; i++) {
            const ratio = i / halfLength;
            heights[fromI + i] = startHeight - (valleyHeight * (1 - downSteepMiddle(ratio)));
        }

        for (let i = halfLength; i < valleyLength; i++) {
            const ratio = (i - halfLength) / (valleyLength - halfLength);
            heights[fromI + i] = middleHeight + (valleyHeightAfterMiddle * (1 - downSteepMiddle(ratio)));
        }

        return fromI + valleyLength;
    };

    const sizeX = 512;
    const sizeZ = 8;
    const sizeY = 300;
    const frequency = 0.1;

    for (let i = 0; i < sizeX; i++) {
        const slope = sizeY - (i / sizeX) * sizeY;
        const waves = Math.sin(i * Math.PI * frequency);

        let height = slope + waves;

        heights.push(height);
    }

    for (let i = 0; i < sizeX; i++) {
        if (i == sizeX/2) {
            i = makeJump(i);
        }

        if (i == sizeX/4 - 5 || i == sizeX*3/4 - 5) {
            i = makeValley(i);
        }

        if (i > 20) {
            heights[i] = 300;
        }

        /*const goalStart = 0.995;
        const goalEnd = 1.0;
        if (i > sizeX * goalStart && i < sizeX * goalEnd) {
            heights[i] += 10;
        }*/

        heights[i] += 5;
    }

    const heightfieldMatrix = [];

    for (let height of heights) {
        height = Math.max(0, height); // Values can not be negative! 

        const row = [];
        
        for (let j = 0; j < sizeZ; j++) {
            row.push(height);
        }
        
        heightfieldMatrix.push(row);
    }

    return heightfieldMatrix;
}