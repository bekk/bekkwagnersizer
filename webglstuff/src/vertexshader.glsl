
uniform float time;
uniform float deviance;
varying vec2 vUv;
varying vec3 vNormal;

float random3D(vec3 coord) {
  return fract(sin(dot(coord.xyz ,vec3(12.9898,78.233,1.23456))) * 43758.5453);
}

float random3D(float x, float y, float z) {
  return random3D(vec3(x, y, z));
}

float random3D(int x, int y, int z) {
  return random3D(float(x), float(y), float(z));
}

void main() {
  vUv = uv;
  vNormal = normal;

  vec4 worldPosition = modelMatrix * vec4(position, 1.0);
  vec3 modifiedPosition = position;

  float adjustedTime = time + deviance*10.0;
  
  modifiedPosition.x += sin(worldPosition.y / 10.0 + adjustedTime/2.5) * 2.0;

  float worldHeightStepped = ((worldPosition.y + 0.6) / 3.0);
  float noise = sin(worldHeightStepped * 2.0);

  float noiseStrength = 0.06 + abs(worldPosition.z)/100.0 * 0.04;
  modifiedPosition.x += noise * noiseStrength;
  modifiedPosition.y += noise * noiseStrength;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(modifiedPosition, 1.0);
}