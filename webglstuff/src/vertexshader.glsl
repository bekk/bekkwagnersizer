
uniform float time;
uniform float deviance;
varying vec2 vUv;

void main() {
  vUv = uv;

  vec4 worldPosition = modelMatrix * vec4(position, 1.0);
  vec3 modifiedPosition = position;

  float adjustedTime = time + deviance*10.0;
  
  modifiedPosition.x += sin(worldPosition.y / 10.0 + adjustedTime/2.0) * 2.0;

  gl_Position = projectionMatrix * modelViewMatrix * 
  vec4(modifiedPosition, 1.0);
}