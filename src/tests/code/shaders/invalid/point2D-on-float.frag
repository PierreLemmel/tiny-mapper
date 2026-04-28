// { type: "point2D", min: [0.0, 0.0], max: [1.0, 1.0], default: [0.5, 0.5] }
uniform float scalar;

void main() {
    gl_FragColor = vec4(scalar);
}
