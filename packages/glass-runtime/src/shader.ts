export const glassVertexShader = `
  attribute vec2 a_position;

  uniform vec2 u_viewport;
  uniform vec4 u_rect;

  varying vec2 v_local;

  void main() {
    vec2 position = u_rect.xy + (a_position * u_rect.zw);
    vec2 clip = (position / u_viewport) * 2.0 - 1.0;
    clip.y *= -1.0;
    gl_Position = vec4(clip, 0.0, 1.0);
    v_local = a_position;
  }
`;

export const glassFragmentShader = `
  #ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
  #else
    precision mediump float;
  #endif

  uniform vec2 u_viewport;
  uniform vec2 u_rect_size;
  uniform float u_pixel_ratio;
  uniform vec4 u_radii;
  uniform float u_edge_width;
  uniform float u_softness;
  uniform float u_opacity;
  uniform vec3 u_carrier;
  uniform vec3 u_edge_light;
  uniform vec3 u_primary;
  uniform vec3 u_secondary;
  uniform vec3 u_tertiary;

  varying vec2 v_local;

  float roundedBoxSdf(vec2 point, vec2 half_size, vec4 radii) {
    vec2 signedPoint = point;
    vec2 cornerPair = signedPoint.x > 0.0 ? radii.xy : radii.wz;
    float radius = signedPoint.y > 0.0 ? cornerPair.y : cornerPair.x;
    vec2 q = abs(signedPoint) - half_size + radius;
    return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - radius;
  }

  float edgeDistance(vec2 point, vec2 half_size, vec4 radii) {
    return roundedBoxSdf(point, half_size, radii);
  }

  void main() {
    vec2 point = (v_local * u_rect_size) - (u_rect_size * 0.5);
    vec2 halfSize = u_rect_size * 0.5;
    vec2 pixelSize = u_rect_size / (u_viewport * u_pixel_ratio);
    float antiAlias = max(max(pixelSize.x, pixelSize.y) * 0.75, 0.35);
    vec2 sampleStep = max(pixelSize, vec2(0.35));
    float distance = edgeDistance(point, halfSize, u_radii);
    float distanceX = edgeDistance(point + vec2(sampleStep.x, 0.0), halfSize, u_radii)
      - edgeDistance(point - vec2(sampleStep.x, 0.0), halfSize, u_radii);
    float distanceY = edgeDistance(point + vec2(0.0, sampleStep.y), halfSize, u_radii)
      - edgeDistance(point - vec2(0.0, sampleStep.y), halfSize, u_radii);
    vec2 normal = normalize(vec2(distanceX, distanceY) + vec2(0.0001));

    float inside = 1.0 - smoothstep(-antiAlias, antiAlias, distance);
    // Softness only anti-aliases the silhouette. A large blur must not turn
    // into a second, visibly painted border.
    float edgeFalloff = clamp(u_softness * 0.05, 0.2, 0.42);
    float edge = 1.0 - smoothstep(0.0, u_edge_width + edgeFalloff, -distance);
    float edgeMask = inside * edge;

    vec2 topLeftDirection = normalize(vec2(-0.58, -0.82));
    vec2 bottomRightDirection = normalize(vec2(0.68, 0.74));
    float topLeftLight = max(dot(normal, topLeftDirection), 0.0);
    float bottomRightScatter = max(dot(normal, bottomRightDirection), 0.0);
    float leftCatch = max(-normal.x, 0.0);
    float rightCatch = max(normal.x, 0.0);
    float topCatch = max(-normal.y, 0.0);
    float bottomCatch = max(normal.y, 0.0);
    // The opposing corners are orthogonal to both main light directions.
    // Give them a small chromatic bridge so the rounded silhouette never
    // appears to have a missing piece.
    float cornerCatch = abs(normal.x * normal.y);

    // Keep a thick token edge narrow on screen, but let its chromatic response
    // become stronger. This is the refraction gain, not a white-line gain.
    float thicknessScale = clamp(0.82 + (u_edge_width * 0.55), 0.9, 1.65);
    float chromaticStrength = clamp(0.9 + ((thicknessScale - 1.0) * 1.4), 0.9, 1.8);
    // The light theme's edge-light token is near-white. Use its luminance as
    // a theme signal so light surfaces suppress white carrier light while
    // increasing the visibility of the sampled accent colours.
    float edgeLightLuminance = dot(u_edge_light, vec3(0.2126, 0.7152, 0.0722));
    float lightSurface = smoothstep(0.55, 0.88, edgeLightLuminance);
    float chromaticVisibility = mix(1.0, 1.34, lightSurface);

    // Keep the carrier and incident light restrained. Directional accent colors
    // do the visible refraction work; edgeLight must never close into a white
    // outline, especially on the light theme where it is near-white.
    vec3 refractedBase = mix(u_primary, u_secondary, 0.48 + (bottomRightScatter * 0.2));
    refractedBase = mix(refractedBase, u_carrier, 0.015);
    float edgeLightCatch = (0.003 + (topLeftLight * 0.012)) * (2.0 - thicknessScale) * mix(1.0, 0.24, lightSurface);
    vec3 lightBlend = mix(refractedBase, u_edge_light, edgeLightCatch);
    vec3 lowerBlend = mix(u_primary, u_secondary, 0.24 + (bottomRightScatter * 0.4));
    float rightRefraction = clamp(rightCatch * 0.52 * chromaticStrength * chromaticVisibility, 0.0, 0.94);
    lowerBlend = mix(lowerBlend, u_tertiary, rightRefraction);
    vec3 color = mix(lightBlend, lowerBlend, bottomCatch * 0.5);
    vec3 topLeftRefraction = mix(u_secondary, u_primary, 0.35);
    color = mix(color, topLeftRefraction, topLeftLight * 0.24 * chromaticStrength);
    color = mix(color, u_secondary, leftCatch * 0.46 * chromaticStrength);
    color = mix(color, u_tertiary, rightRefraction);
    float lowerRightRefraction = rightCatch * bottomCatch * lightSurface;
    color = mix(color, u_tertiary, lowerRightRefraction * 0.2 * chromaticVisibility);
    vec3 cornerBlend = mix(u_secondary, u_tertiary, 0.5 + (normal.y * 0.18));
    color = mix(color, cornerBlend, cornerCatch * 0.38 * chromaticStrength);

    float coolFringe = ((rightCatch * 0.44) + (topCatch * 0.12)) * chromaticStrength;
    float warmFringe = ((bottomCatch * 0.32) + (leftCatch * 0.1)) * chromaticStrength;
    color.r += warmFringe * 0.045;
    color.g += topLeftLight * 0.055 * chromaticStrength;
    color.b += coolFringe * 0.2;
    color = clamp(color, 0.0, 1.0);
    vec3 lightChromaticColor = color * vec3(0.78, 0.88, 1.0);
    color = mix(color, lightChromaticColor, lightSurface * 0.72);

    // Elevated dark cards use a low edge opacity. Keep their silhouette nearly
    // neutral so a translucent surface does not turn into a blue-violet outline;
    // the brighter elevated/light variants retain their refractive color.
    float chromaticVariantStrength = smoothstep(0.3, 0.5, u_opacity);
    vec3 neutralEdgeColor = vec3(dot(color, vec3(0.2126, 0.7152, 0.0722)));
    float chromaticEdgeStrength = mix(0.12, 1.0, chromaticVariantStrength);
    color = mix(neutralEdgeColor, color, chromaticEdgeStrength);

    // There is deliberately no uniform base alpha: these directional catches
    // must break up instead of closing into a white outline around the card.
    float directionalAlpha = smoothstep(0.16, 0.82, topLeftLight) * 0.42
      + smoothstep(0.16, 0.82, bottomRightScatter) * 0.46
      + (leftCatch * 0.04)
      + (rightCatch * 0.06)
      + (topCatch * 0.018)
      + (bottomCatch * 0.05)
      + (cornerCatch * 0.16);
    float lightAlphaGain = mix(1.0, 1.35, lightSurface);
    float alpha = edgeMask * u_opacity * directionalAlpha * thicknessScale * lightAlphaGain;
    alpha = clamp(alpha, 0.0, 0.34);

    gl_FragColor = vec4(color, alpha);
  }
`;
