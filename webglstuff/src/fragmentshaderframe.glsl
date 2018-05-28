
uniform float time;
uniform float deviance;
uniform vec3 color;

void main() {
  gl_FragColor = vec4(color.xyz, 1.0);
}