varying vec2 vUv;

/* Indicates here all the uniforms that are used by the shader.
   These uniforms will be used to control the shader's behavior.
   They will be set by the user in the material editor.
   You can specify the type, min, max and default values for the uniforms using a json object preceding the uniform declaration. Min, max and default type must match the uniform type.
*/

// { type: "slider", label: "Intensity", min: 0.0, max: 1.0, default: 1.0 }
uniform float intensity;

// { type: "point2D", label: "Center", min: [-1.0, -1.0], max: [1.0, 1.0], default: [0.0, 0.0] }
uniform vec2 center;

/* {
    type: "color",
    label: "Color",
    min: [0.0, 0.0, 0.0, 0.0],
    max: [1.0, 1.0, 1.0, 1.0],
    default: [1.0, 1.0, 1.0, 1.0]
} */
uniform vec4 color;

void main() {
    gl_FragColor = color * intensity;
}