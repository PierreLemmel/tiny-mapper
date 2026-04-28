/* {
    type: "enum",
    options: [
        { id: 0, label: 123 }
    ],
    default: 0
} */
uniform int mode;

void main() {
    gl_FragColor = vec4(float(mode));
}
