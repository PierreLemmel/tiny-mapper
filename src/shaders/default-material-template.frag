varying vec2 vUv;

uniform vec3 uColor;
uniform float uOpacity;
uniform float uFeathering;

void main() {

    float opacity = uOpacity;

    if (uFeathering > 0.0) {

        vec2 distFromEdge = 2.0 * min(vUv, 1.0 - vUv);

        float maskX = smoothstep(0.0, uFeathering, distFromEdge.x);
        float maskY = smoothstep(0.0, uFeathering, distFromEdge.y);

        opacity *= maskX * maskY;
    }

    vec4 result = vec4(uColor, opacity);
    gl_FragColor = result;
}
