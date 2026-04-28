// { type: "timed", timeScale: 1.0, default: "now" }
uniform float clock;

void main() {
    gl_FragColor = vec4(clock);
}
