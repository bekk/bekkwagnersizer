
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

        /*const goalStart = 0.995;
        const goalEnd = 1.0;
        if (i > sizeX * goalStart && i < sizeX * goalEnd) {
            heights[i] += 10;
        }*/
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