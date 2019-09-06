export function setUpComposer(scene, camera, renderer) {
    renderer.autoClear = false;

    const composer = new THREE.EffectComposer(renderer);

    const renderPass = new THREE.RenderPass(scene, camera);
    renderPass.renderToScreen = false;
    renderPass.clear = true;
    composer.addPass(renderPass);

    const threshold = 0.2;
    const strength = 1.25;
    const radius = 0.6;
    const bloomPass = new THREE.UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), strength, radius, threshold);
    composer.addPass(bloomPass)

    const effectCopy = new THREE.ShaderPass(THREE.CopyShader);
    effectCopy.renderToScreen = true;
    composer.addPass(effectCopy);

    return composer;
}