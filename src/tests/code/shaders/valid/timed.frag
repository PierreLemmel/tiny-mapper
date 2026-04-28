// { type: "timed", label: "Time", timeScale: 1.0, default: 0.0 }
uniform float time;

void main() {
    gl_FragColor = vec4(sin(time));
}
