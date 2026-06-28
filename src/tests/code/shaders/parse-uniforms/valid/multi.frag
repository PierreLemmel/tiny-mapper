varying vec2 vUv;

// { type: "slider", label: "Intensity", min: 0.0, max: 2.0, default: 1.0 }
uniform float intensity;

// { type: "point2D", label: "Center", min: [-1.0, -1.0], max: [1.0, 1.0], default: [0.0, 0.0] }
uniform vec2 center;

/* {
    type: "color",
    label: "Color",
    default: [1.0, 1.0, 1.0, 1.0]
} */
uniform vec4 color;

uniform sampler2D tex;

void main() {
    gl_FragColor = color * intensity + vec4(center, 0.0, 0.0);
}
