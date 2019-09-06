import {getImageData, getPixel, setPixel, imageDataToString, scaleImageData} from '../util.js';

export function analyzeImage(imagedata) { // TODO: Bruk ray-algoritmen fra geometrisk senter
    console.log("analyzeImage!", imagedata);

    const scaledDimension = 64;
    //const nofRays = 24;
    const scaledimage = scaleImageData(imagedata, scaledDimension, scaledDimension);
    
    const minCoord = new THREE.Vector2(scaledDimension, scaledDimension);
    const maxCoord = new THREE.Vector2(0, 0);

    const colorCounts = new THREE.Vector3();

    for (let x = 0; x < scaledDimension; x++) {
        for (let y = 0; y < scaledDimension; y++) {
            const pixel = getPixel(scaledimage, x, y);
            const coord = new THREE.Vector2(x, y);

            if (pixel.a > 255/2) {
                const closestColor = getClosestColor(pixel);
                colorCounts.add(closestColor);
                minCoord.min(coord);
                maxCoord.max(coord);
            }
        }
    }

    const centerCoord = minCoord.clone().add(maxCoord.clone().sub(minCoord).multiplyScalar(1/2)).floor();

    const size = maxCoord.clone().sub(minCoord).multiplyScalar(1/scaledDimension);
    const center = centerCoord.clone().multiplyScalar(1/scaledDimension);
    const min = minCoord.clone().multiplyScalar(1/scaledDimension);
    const max = maxCoord.clone().multiplyScalar(1/scaledDimension);
    const color = colorCounts.clone().multiplyScalar(1/Math.max(colorCounts.x, colorCounts.y, colorCounts.z));

    setPixel(scaledimage, minCoord.x, minCoord.y, {r: 0, g: 0, b: 0, a: 255});
    setPixel(scaledimage, maxCoord.x, maxCoord.y, {r: 0, g: 0, b: 0, a: 255});
    setPixel(scaledimage, centerCoord.x, centerCoord.y, {r: 0, g: 0, b: 0, a: 255});

    const result = {min, max, center, size, color};

    console.log("Result:", result);
    //console.log(imageDataToString(scaledimage));

    const padding = 1.2;
    result.size.multiplyScalar(padding); // For å få med deler som ikke er perfekt runde

    return result; 
}

const green = new THREE.Color(0x00ff02);
const blue = new THREE.Color(0x00e7e2);
const red = new THREE.Color(0xf104f5);

const pureGreen = new THREE.Vector3(0, 1, 0);
const pureBlue = new THREE.Vector3(0, 0, 1);
const pureRed = new THREE.Vector3(1, 0, 0);

function colorDistance(a, b) {
    const d = {
        r: b.r - a.r,
        g: b.g - a.g,
        b: b.b - a.b,
    };
    return Math.sqrt(d.r*d.r + d.g*d.g + d.b*d.b);
}

function getClosestColor(pixel) {
    const redDistance = colorDistance(pixel, red);
    const greenDistance = colorDistance(pixel, green);
    const blueDistance = colorDistance(pixel, blue);

    if (redDistance < greenDistance && redDistance < blueDistance) {
        return pureRed;
    };

    if (greenDistance < redDistance && greenDistance < blueDistance) {
        return pureGreen;
    };

    return pureBlue;
}