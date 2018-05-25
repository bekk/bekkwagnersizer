
uniform float time;
uniform float deviance;

void main() {

  gl_FragColor = vec4(1.0, (deviance)*0.3 + 0.5, (deviance)*0.5 + 0.3, 1.0);
}