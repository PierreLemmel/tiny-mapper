// { type: "color", default: [1.0, 0.0, 0.0, 1.0] }
uniform float wrongColor;

void main() {
    gl_FragColor = vec4(wrongColor);
}
