// { type: "slider", min: 0.0, max: 1.0, default: 5.0 }
uniform vec2 alpha;

// { type: "color", default: [1.0, 0.0, 0.0, 1.0] }
uniform float beta;

// { type: "enum", options: [{ id: "x", label: 42 }], default: "no" }
uniform int gamma;

void main() {
    gl_FragColor = vec4(beta);
}
