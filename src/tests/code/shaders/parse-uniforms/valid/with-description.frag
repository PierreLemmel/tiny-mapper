// { type: "slider", label: "Roughness", description: "Surface roughness factor", min: 0.0, max: 1.0, default: 0.3 }
uniform float roughness;

void main() {
    gl_FragColor = vec4(roughness);
}
