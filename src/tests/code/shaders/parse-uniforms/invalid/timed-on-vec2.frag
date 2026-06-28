// { type: "timed", timeScale: 1.0 }
uniform vec2 offset;

void main() {
    gl_FragColor = vec4(offset, 0.0, 1.0);
}
