// { type: "point2D", label: "Center", min: [-1.0, -1.0], max: [1.0, 1.0], default: [0.0, 0.0] }
uniform vec2 center;

void main() {
    gl_FragColor = vec4(center, 0.0, 1.0);
}
