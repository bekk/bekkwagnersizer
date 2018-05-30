
uniform float time;
uniform float deviance;
uniform vec3 color;
varying vec3 vNormal;

void main() {
    vec3 shadedColor = color;
    //shadedColor *= dot(vNormal, vec3(1.0, 1.0, 1.0)); 
    shadedColor -= vNormal.z * 0.25;
    gl_FragColor = vec4(shadedColor, 1.0);
}