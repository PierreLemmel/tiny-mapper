/* {
    type: "enum",
    label: "Blend Mode",
    options: [
        { id: 0, label: "Normal" },
        { id: 1, label: "Add" },
        { id: 2, label: "Multiply" }
    ],
    default: 1
} */
uniform int blendMode;

void main() {
    gl_FragColor = vec4(float(blendMode) / 2.0);
}
