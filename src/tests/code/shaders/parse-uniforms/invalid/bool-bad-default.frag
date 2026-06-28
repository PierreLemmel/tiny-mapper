// { type: "bool", default: 2 }
uniform bool flag;

void main() {
    gl_FragColor = vec4(flag ? 1.0 : 0.0);
}
