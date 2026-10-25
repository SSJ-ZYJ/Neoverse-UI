export const glassVertexShader = `
  attribute vec2 a_position;

  uniform vec2 u_viewport;
  uniform vec4 u_rect;

  varying vec2 v_local;
  varying vec2 v_viewport;

  void main() {
    vec2 position = u_rect.xy + (a_position * u_rect.zw);
    vec2 clip = (position / u_viewport) * 2.0 - 1.0;
    clip.y *= -1.0;
    gl_Position = vec4(clip, 0.0, 1.0);
    v_local = a_position;
    v_viewport = position;
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
  uniform vec3 u_pointer;
  uniform float u_edge_width;
  uniform float u_softness;
  uniform float u_opacity;
  uniform float u_light_surface;
  uniform float u_corner_focus;
  uniform float u_chroma;
  uniform float u_gain;
  uniform vec3 u_carrier;
  uniform vec3 u_edge_light;
  uniform vec3 u_primary;
  uniform vec3 u_secondary;
  uniform vec3 u_tertiary;
  uniform vec4 u_occluders[6];
  uniform float u_occluder_radii[6];
  uniform float u_occluder_count;

  varying vec2 v_local;
  varying vec2 v_viewport;

  float roundedBoxSdf(vec2 point, vec2 half_size, vec4 radii) {
    vec2 signedPoint = point;
    vec2 cornerPair = signedPoint.x > 0.0 ? radii.xy : radii.wz;
    float radius = signedPoint.y > 0.0 ? cornerPair.y : cornerPair.x;
    vec2 q = abs(signedPoint) - half_size + radius;
    return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - radius;
  }

  float segmentDistance(vec2 point, vec2 start, vec2 end) {
    vec2 segment = end - start;
    float projection = clamp(dot(point - start, segment) / dot(segment, segment), 0.0, 1.0);
    return length(point - start - segment * projection);
  }

  float edgeDistance(vec2 point, vec2 half_size, vec4 radii) {
    if (u_pointer.z > 0.0) {
      vec2 local = vec2(abs(point.x - u_pointer.x), point.y - half_size.y);
      if (local.x < u_pointer.y + u_pointer.z && local.y > -u_pointer.z) {
        // Replace the bottom segment with two slopes. Measuring the exposed
        // contour directly keeps an internal horizontal seam out of the glass.
        float slope = segmentDistance(local, vec2(u_pointer.y, 0.0), vec2(0.0, u_pointer.z));
        float lowerSegment = length(vec2(max(u_pointer.y - local.x, 0.0), local.y));
        float distance = min(slope, lowerSegment);
        bool inside = local.y <= 0.0 || local.x / u_pointer.y + local.y / u_pointer.z <= 1.0;
        return inside ? -distance : distance;
      }
    }
    return roundedBoxSdf(point, half_size, radii);
  }

  void main() {
    vec2 drawSize = u_rect_size + vec2(0.0, u_pointer.z);
    vec2 point = (v_local * drawSize) - (u_rect_size * 0.5);
    vec2 halfSize = u_rect_size * 0.5;
    vec2 pixelSize = vec2(1.0 / max(u_pixel_ratio, 1.0));
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
    // Give them a small light bridge so the rounded silhouette never
    // appears to have a missing piece.
    float cornerCatch = abs(normal.x * normal.y);
    // The top-right and bottom-left corners sit between the two directional
    // catches. Keep a separate, neutral bridge for those opposing quadrants
    // so low-opacity dark Aurora Glass does not visually lose either corner.
    float opposingCornerCatch = max(
      max(normal.x, 0.0) * max(-normal.y, 0.0),
      max(-normal.x, 0.0) * max(normal.y, 0.0)
    );

    // Edge width controls light gain while the perimeter stays narrow.
    float thicknessScale = clamp(0.82 + (u_edge_width * 0.55), 0.9, 1.65);
    float chromaticStrength = clamp(0.9 + ((thicknessScale - 1.0) * 1.4), 0.9, 1.8);
    float edgeLightLuminance = dot(u_edge_light, vec3(0.2126, 0.7152, 0.0722));
    float lightSurface = u_light_surface >= 0.0
      ? u_light_surface
      : smoothstep(0.55, 0.88, edgeLightLuminance);
    float chromaticVisibility = mix(1.0, 1.34, lightSurface);

    // Restore the established Aurora Glass chromatic edge field. The surface body
    // still gets its transparency and blur from CSS; WebGL only supplies the
    // directional refractive silhouette.
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
    // 0.2.0 kept low-opacity dark Aurora Glass nearly neutral. Chroma is independent
    // of today's brighter edge opacity, so stronger lighting cannot recolour it.
    vec3 neutralEdgeColor = vec3(dot(color, vec3(0.2126, 0.7152, 0.0722)));
    color = mix(neutralEdgeColor, color, u_chroma);
    // There is deliberately no uniform base alpha: these directional catches
    // must break up instead of closing into a white outline around the card.
    float directionalAlpha = smoothstep(0.16, 0.82, topLeftLight) * 0.42
      + smoothstep(0.16, 0.82, bottomRightScatter) * 0.46
      + (leftCatch * 0.04)
      + (rightCatch * 0.06)
      + (topCatch * 0.018)
      + (bottomCatch * 0.05)
      + (cornerCatch * 0.16)
      + (opposingCornerCatch * 0.28);
    // Broader opposing catches extend along the adjacent edges. Round buttons
    // follow their normals instead of distances to absent bounding-box corners.
    float cornerReach = max(min(u_rect_size.x * 0.65, u_rect_size.y * 2.4), 16.0);
    float topLeftFocus = 1.0 - smoothstep(cornerReach * 0.3, cornerReach, length(point + halfSize));
    float bottomRightFocus = 1.0 - smoothstep(cornerReach * 0.3, cornerReach, length(point - halfSize));
    // Keep a broad catch from reaching the opposite corners on short rectangles.
    topLeftFocus *= 1.0 - smoothstep(0.65, 1.0, max(v_local.x, v_local.y));
    bottomRightFocus *= 1.0 - smoothstep(0.65, 1.0, max(1.0 - v_local.x, 1.0 - v_local.y));
    float shortSide = min(u_rect_size.x, u_rect_size.y);
    float aspect = max(u_rect_size.x, u_rect_size.y) / max(shortSide, 1.0);
    float smallestRadius = min(min(u_radii.x, u_radii.y), min(u_radii.z, u_radii.w));
    float roundButton = step(shortSide * 0.45, smallestRadius) * (1.0 - smoothstep(1.02, 1.2, aspect));
    topLeftFocus = mix(topLeftFocus, 1.0, roundButton);
    bottomRightFocus = mix(bottomRightFocus, 1.0, roundButton);
    float cornerAlpha = pow(topLeftLight, 2.0) * topLeftFocus * 0.72
      + pow(bottomRightScatter, 2.0) * bottomRightFocus * 0.78;
    // Preserve a quiet straight side between the two bright catches. Spatial
    // corner focus must not erase the middle of a button's vertical contour.
    cornerAlpha += leftCatch * 0.1 + rightCatch * 0.12;
    directionalAlpha = mix(directionalAlpha, cornerAlpha, u_corner_focus);
    float lightAlphaGain = mix(1.0, 1.35, lightSurface);
    float alpha = edgeMask * u_opacity * directionalAlpha * thicknessScale * lightAlphaGain;
    alpha = clamp(alpha, 0.0, 0.34);

    // The shared canvas paints above every overlay, so an edge would pierce
    // drawers, popovers, and scrims that cover the surface. The DOM material
    // below those overlays already supplies the correct blurred silhouette,
    // so fade the crisp canvas edge out under each occluding rect.
    float occlusionMask = 1.0;
    for (int i = 0; i < 6; i++) {
      if (float(i) >= u_occluder_count) {
        break;
      }
      vec4 occluder = u_occluders[i];
      vec2 occluderPoint = v_viewport - occluder.xy - (occluder.zw * 0.5);
      float occluderRadius = max(u_occluder_radii[i], 0.0);
      float occluderDistance = roundedBoxSdf(
        occluderPoint,
        occluder.zw * 0.5,
        vec4(occluderRadius)
      );
      occlusionMask *= smoothstep(-antiAlias, 0.0, occluderDistance);
    }
    alpha *= occlusionMask;

    if (alpha <= 0.0001) discard;
    // The release composited alpha*color + (1-alpha^2)*backdrop. Preserve that
    // RGB response at middle grey, including its neutral contribution, rather
    // than subtracting the minimum channel and renormalizing its hue.
    // Exposure scales the completed RGB response, after alpha limiting. Raising
    // opacity alone would hit the alpha cap and leave pale highlights unchanged.
    vec3 channelGain = clamp((2.0 * alpha * color - vec3(alpha * alpha)) * u_gain, 0.0, 1.0);
    // Overlay with Cs=(1+g)/2 gives Cb + g*min(Cb,1-Cb). The increment uses
    // live backdrop energy and remaining highlight headroom: black/zero stay
    // zero, and pale coloured edges no longer clip all channels to white.
    vec3 encodedGain = (vec3(1.0) + channelGain) * 0.5;
    gl_FragColor = vec4(encodedGain, 1.0);
  }
`;
