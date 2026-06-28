// { type: "timed", timeScale: "fast" }
uniform float clock;

void main() {
    gl_FragColor = vec4(clock);
}
