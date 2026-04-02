varying vec2 vUv;

uniform vec3 uColor;
uniform float uOpacity;
uniform float uFeathering;

float invLerp(float min, float max, float value) {
    return clamp((value - min) / (max - min), 0.0, 1.0);
}

const float SQRT_2 = 1.4142135623730951;
const float SQRT_2_OVER_2 = 0.7071067811865476;

void main() {

    float distanceToEdge = 2.0 * min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y));

    float opacity = uOpacity;

    if (uFeathering > 0.0) {

        vec2 distFromEdge = 2.0 * min(vUv, 1.0 - vUv);

        float maskX = smoothstep(0.0, uFeathering, distFromEdge.x);
        float maskY = smoothstep(0.0, uFeathering, distFromEdge.y);

        opacity *=  maskX * maskY;
    }
    

    vec4 result = vec4(uColor, opacity);
    gl_FragColor = result;
}
