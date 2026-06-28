// { type: "slider", min: 0.0, max: 1.0, default: 0.5 }
uniform float alpha;
// { type: "slider", min: 0.0, max: 1.0, default: 0.25 }
uniform float alpha;

// { type: "bool", default: true }
uniform bool beta;
// { type: "bool", default: false }
uniform bool beta;

void main() {
    gl_FragColor = vec4(alpha);
}
