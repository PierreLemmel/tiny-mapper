/* {
    type: "enum",
    options: [
        { id: 0, label: "First" },
        { id: 1.5, label: "Bad" }
    ],
    default: 0
} */
uniform int mode;

void main() {
    gl_FragColor = vec4(float(mode));
}
