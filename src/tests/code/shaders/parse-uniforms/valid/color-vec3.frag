// { type: "color", label: "Albedo", default: [0.8, 0.2, 0.6] }
uniform vec3 albedo;

void main() {
    gl_FragColor = vec4(albedo, 1.0);
}
