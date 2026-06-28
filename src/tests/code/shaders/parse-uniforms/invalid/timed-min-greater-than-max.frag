// { type: "timed", min: 5.0, max: 1.0 }
uniform float clock;

void main() {
    gl_FragColor = vec4(clock);
}
