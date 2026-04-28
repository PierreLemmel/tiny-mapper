// { type: "slider", min: 0.0, max: 1.0, default: 0.5 }
uniform vec2 wrongType;

void main() {
    gl_FragColor = vec4(wrongType, 0.0, 1.0);
}
