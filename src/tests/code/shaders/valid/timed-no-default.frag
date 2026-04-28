// { type: "timed", timeScale: 0.5 }
uniform float clock;

void main() {
    gl_FragColor = vec4(clock);
}
