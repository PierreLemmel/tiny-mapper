uniform sampler2D tex;
uniform mat4 viewMatrix;

// { type: "slider", label: "Strength", min: 0.0, max: 5.0, default: 1.0 }
uniform float strength;

void main() {
    gl_FragColor = vec4(strength);
}
