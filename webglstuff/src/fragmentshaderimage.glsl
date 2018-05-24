
uniform float time;
uniform sampler2D map;
varying vec2 vUv;

void main() {

   vec4 tex = texture2D(map, vUv);

    gl_FragColor = vec4(tex.xyz, tex.w);
}