// { type: "slider", min 0.0, max: 1.0, default: 0.5 }
uniform float broken;

void main() {
    gl_FragColor = vec4(broken);
}
