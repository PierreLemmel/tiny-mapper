// { type: "timed", timeScale: 1.0, default: 0.0 }
uniform vec2 wrongType;

void main() {
    gl_FragColor = vec4(wrongType, 0.0, 1.0);
}
