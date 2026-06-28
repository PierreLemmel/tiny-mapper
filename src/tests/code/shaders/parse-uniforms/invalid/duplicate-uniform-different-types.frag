// { type: "slider", min: 0.0, max: 1.0, default: 0.5 }
uniform float sharedUniform;

// { type: "color", default: [1.0, 0.0, 0.0, 1.0] }
uniform vec4 sharedUniform;

void main() {
    gl_FragColor = vec4(sharedUniform);
}
