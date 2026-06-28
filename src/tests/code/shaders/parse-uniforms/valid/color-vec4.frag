/* {
    type: "color",
    label: "Tint",
    default: [1.0, 0.5, 0.25, 1.0]
} */
uniform vec4 tint;

void main() {
    gl_FragColor = tint;
}
