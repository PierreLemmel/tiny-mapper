// { type: "slider", min: 0.0, max: 1.0, default: 0.5 }
uniform float intensity;

// { type: "slider", min: 0.0, max: 10.0, default: 5.0 }
uniform float intensity;

void main() {
    gl_FragColor = vec4(intensity);
}
