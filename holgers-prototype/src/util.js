function createPlaneGeometry(height, width) {
  const geometry = new THREE.PlaneGeometry();
  geometry.vertices[0].set(height/2, 0, -width/2);
  geometry.vertices[1].set(height/2, 0, width/2);
  geometry.vertices[2].set(-height/2, 0, -width/2);
  geometry.vertices[3].set(-height/2, 0, width/2);

  return geometry;
}

export {
  createPlaneGeometry,
}