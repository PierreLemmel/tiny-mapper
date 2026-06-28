// { type: "bool", label: "Enabled", default: true }
uniform bool enabled;

// { type: "bool", default: 0 }
uniform bool reverse;

void main() {
    if (enabled) {
        gl_FragColor = vec4(reverse ? 0.0 : 1.0);
    } else {
        gl_FragColor = vec4(0.0);
    }
}
