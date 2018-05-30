
uniform float time;
uniform sampler2D map;
varying vec2 vUv;

int inRange(float a, float b, float margin) {
    if (a <= b+margin && a >= b-margin) return 1;
    else return 0;
}

void main() {

    //vec3 pink = vec3(214.0/255.0, 154.0/255.0, 206.0/255.0);
    vec3 pink = vec3(243.0/255.0, 217.0/255.0, 232.0/255.0);
    float margin = 0.3;

    vec4 tex = texture2D(map, vUv);

    if (
        inRange(tex.x, pink.x, margin) == 1 &&
        inRange(tex.y, pink.y, margin) == 1 &&
        inRange(tex.z, pink.z, margin) == 1
    ) {
        //tex = vec4(1.0, 1.0, 0.85, 1.0);
    } else {
        //tex = vec4(0.0, 0.0, 1.0, 1.0);
    }

    gl_FragColor = vec4(tex.xyz, tex.w);
}