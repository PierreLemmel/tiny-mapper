// { type: "timed", default: 0.0 }
uniform float ticking;

void main() {
    gl_FragColor = vec4(ticking);
}
