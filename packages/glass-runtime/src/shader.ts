export const glassVertexShader = `
  attribute vec2 a_position;

  uniform vec2 u_viewport;
  uniform vec4 u_rect;
  uniform vec4 u_basis;

  varying vec2 v_local;
  varying vec2 v_viewport;

  void main() {
    vec2 center = u_rect.xy + (u_rect.zw * 0.5);
    vec2 localOffset = (a_position - 0.5) * u_rect.zw;
    vec2 position = center + (u_basis.xy * localOffset.x) + (u_basis.zw * localOffset.y);
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
  uniform float u_color_dodge;
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

    float edgeLightLuminance = dot(u_edge_light, vec3(0.2126, 0.7152, 0.0722));
    float lightSurface = u_light_surface >= 0.0
      ? u_light_surface
      : smoothstep(0.55, 0.88, edgeLightLuminance);
    float shortSide = min(u_rect_size.x, u_rect_size.y);
    float aspect = max(u_rect_size.x, u_rect_size.y) / max(shortSide, 1.0);
    float smallestRadius = min(min(u_radii.x, u_radii.y), min(u_radii.z, u_radii.w));
    float roundButton = step(shortSide * 0.45, smallestRadius) * (1.0 - smoothstep(1.02, 1.2, aspect));
    float volumeScale = lightSurface > 0.5
      ? smoothstep(64.0, 144.0, shortSide) * (1.0 - roundButton)
      : 0.0;
    if (volumeScale > 0.0) {
      // Ease the lighting normal near the axes so the catch leaves each
      // straight edge tangentially, without a kink at the start of the arc.
      normal = normalize(mix(normal, normal * abs(normal), volumeScale));
    }

    float inside = 1.0 - smoothstep(-antiAlias, antiAlias, distance);
    // Softness only anti-aliases the silhouette. A large blur must not turn
    // into a second, visibly painted border.
    float edgeFalloff = clamp(u_softness * 0.05, 0.2, 0.42);

    vec2 keyDirection = normalize(vec2(0.63, 0.78));
    float lighting = dot(normal, keyDirection);
    float topLeftLight = max(-lighting, 0.0);
    float bottomRightScatter = max(lighting, 0.0);
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
    float diagonalArc = 2.0 * (cornerCatch - opposingCornerCatch);

    // Edge width controls light gain while the perimeter stays narrow.
    float thicknessScale = clamp(0.82 + (u_edge_width * 0.55), 0.9, 1.65);
    float chromaticStrength = clamp(0.9 + ((thicknessScale - 1.0) * 1.4), 0.9, 1.8);
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
    vec3 lightChromaticColor = color * vec3(0.9, 0.95, 1.0);
    color = mix(color, lightChromaticColor, lightSurface * 0.72);
    // Light restores 0.2.0's opacity-dependent color response. The chroma
    // token remains an optional multiplier for applications that tune it.
    vec3 neutralEdgeColor = vec3(dot(color, vec3(0.2126, 0.7152, 0.0722)));
    float legacyChroma = mix(0.12, 1.0, smoothstep(0.3, 0.5, u_opacity));
    float chromaticEdgeStrength = lightSurface > 0.5 ? legacyChroma * u_chroma : u_chroma;
    color = mix(neutralEdgeColor, color, chromaticEdgeStrength);
    // The indigo right catch is the one place light Glass reads as blue over
    // pale backdrops. Keep the mint-to-indigo direction, but cap how far blue
    // may pass the green/red content: 0 removes the cast, 1 keeps the release.
    if (lightSurface > 0.5) {
      float coolExcess = max(color.b - max(color.r, color.g), 0.0);
      color.b -= coolExcess * 0.72;
      // A pale backdrop already carries the page's cool hue. Let the light
      // highlight borrow the neutral edge color instead of adding a saturated
      // cyan band on top of it; the accent only tints the remaining mix.
      color = mix(color, u_edge_light, 0.7);
    }
    // There is deliberately no uniform base alpha: these directional catches
    // must break up instead of closing into a white outline around the card.
    float directionalAlpha = smoothstep(0.16, 0.82, abs(lighting)) * 0.44
      + (abs(normal.x) * 0.05)
      + (abs(normal.y) * 0.034)
      + (cornerCatch * 0.16)
      + (opposingCornerCatch * 0.28);
    // Broader opposing catches extend along the adjacent edges. Round buttons
    // follow their normals instead of distances to absent bounding-box corners.
    float cornerReach = max(min(u_rect_size.x * 0.65, u_rect_size.y * 2.4), 16.0);
    float topLeftDistance = length(point + halfSize);
    float bottomRightDistance = length(point - halfSize);
    float topLeftFocus = 1.0 - smoothstep(cornerReach * 0.3, cornerReach, topLeftDistance);
    float bottomRightFocus = 1.0 - smoothstep(cornerReach * 0.3, cornerReach, bottomRightDistance);
    // Keep a broad catch from reaching the opposite corners on short rectangles.
    topLeftFocus *= 1.0 - smoothstep(0.65, 1.0, max(v_local.x, v_local.y));
    bottomRightFocus *= 1.0 - smoothstep(0.65, 1.0, max(1.0 - v_local.x, 1.0 - v_local.y));
    topLeftFocus = mix(topLeftFocus, 1.0, roundButton);
    bottomRightFocus = mix(bottomRightFocus, 1.0, roundButton);
    float cornerAlpha = 0.75 * (pow(topLeftLight, 2.0) * topLeftFocus
      + pow(bottomRightScatter, 2.0) * bottomRightFocus);
    // Preserve a quiet straight side between the two bright catches. Spatial
    // corner focus must not erase the middle of a button's vertical contour.
    cornerAlpha += abs(normal.x) * 0.11;
    directionalAlpha = mix(directionalAlpha, cornerAlpha, u_corner_focus);
    float diagonalVolume = 0.0;
    float diagonalFocus = max(topLeftFocus, bottomRightFocus);
    if (volumeScale > 0.0) {
      // Matching envelopes keep the catches equally fine as edge opacity rises.
      float volumeReach = min(shortSide * 0.36, 96.0);
      float diagonalDistance = min(topLeftDistance, bottomRightDistance);
      diagonalVolume = volumeScale *
        (1.0 - smoothstep(volumeReach * 0.25, volumeReach, diagonalDistance));
      edgeFalloff += 0.61 * diagonalVolume;
      directionalAlpha += 0.24 * abs(lighting) * diagonalVolume;
    }
    float edge = 1.0 - smoothstep(0.0, u_edge_width + edgeFalloff, -distance);
    float alpha = inside * edge * u_opacity * directionalAlpha * thicknessScale;
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
    float darkCorner = 0.0;
    bool darkSurface = lightSurface <= 0.5;
    if (darkSurface) {
      // Lift the diagonal arcs, with zero slope where they meet the straight edges.
      darkCorner = diagonalArc * diagonalArc * (1.0 - roundButton);
    }
    float exposure = u_gain * (1.0 + 0.16 * darkCorner);
    if (u_color_dodge > 0.5) {
      // Encode a proportional backdrop lift rather than raising its RGB floor.
      // Partial coverage retains the original backdrop near channel clipping.
      float luminance = dot(color, vec3(0.2126, 0.7152, 0.0722));
      // The diagonal peaks share neutral exposure; the chroma pass still
      // responds to the local backdrop independently at each corner.
      float cornerLuminance = dot((u_primary + u_secondary) * 0.5, vec3(0.2126, 0.7152, 0.0722));
      cornerLuminance = mix(cornerLuminance, edgeLightLuminance, lightSurface * 0.7);
      luminance = mix(luminance, cornerLuminance, diagonalArc);
      float edgeGain = max(2.0 * alpha * luminance - alpha * alpha, 0.0) * exposure;
      float lift = min(0.25 * edgeGain, 0.074);
      float coverage = min(4.0 * edgeGain, 0.67);
      if (volumeScale > 0.0) {
        // Lift the stronger catches without a flat cutoff or a hotter
        // straight middle. Keep part of the original color at clipping.
        float peak = edgeGain * (0.25 + 0.23 * smoothstep(0.23, 0.50, edgeGain));
        float shoulder = max(peak - 0.074, 0.0);
        float softLift = peak - shoulder + 0.065 * shoulder / (0.065 + shoulder);
        float remaining = 1.0 - min(edgeGain / 0.34, 1.0);
        lift = mix(lift, softLift, volumeScale);
        coverage = mix(coverage, 0.8 * (1.0 - remaining * remaining), volumeScale);
      }
      // Dark arcs need extra lift after the base ceiling, which otherwise
      // flattens their peaks. Leave coverage and straight-edge lift unchanged.
      if (darkSurface) lift *= 4.0 + 2.0 * darkCorner;
      if (lift <= 0.0) discard;
      // Covered dodge yields lift = coverage * dodge / (1 - dodge) before clipping.
      float dodge = lift / (coverage + lift);
      if (volumeScale > 0.0) {
        // Both catches roll off before pale backdrop channels clip. Keep the
        // softer, wider shoulder on large surfaces without applying it twice.
        float excess = max(dodge - 0.036, 0.0);
        float localRolloff = diagonalVolume * excess * excess / (0.011 + excess);
        float paleExcess = max(dodge - 0.03, 0.0);
        float largeRolloff = smoothstep(192.0, 384.0, shortSide) * volumeScale * diagonalFocus;
        largeRolloff *= paleExcess * paleExcess / (0.006 + paleExcess);
        dodge -= max(localRolloff, largeRolloff);
      }
      gl_FragColor = vec4(vec3(dodge), coverage);
      return;
    }

    if (lightSurface > 0.5) {
      // On long straight surfaces, reduce the theme tint in the middle so it
      // does not overpower the composited backdrop's own warm or cool color.
      // The existing directional corners and compact controls are unchanged.
      float wideFactor = smoothstep(3.0, 5.0, u_rect_size.x / max(u_rect_size.y, 1.0));
      float wideReach = max(min(u_rect_size.x * 0.5, u_rect_size.y * 1.25), 16.0);
      float distanceFromEnds = min(v_local.x, 1.0 - v_local.x) * u_rect_size.x;
      float wideMiddle = wideFactor * smoothstep(wideReach * 0.7, wideReach, distanceFromEnds);
      // Removing theme chroma must preserve luminance along the straight rim.
      vec3 neutralHighlight = vec3(dot(color, vec3(0.2126, 0.7152, 0.0722)));
      color = mix(color, neutralHighlight, wideMiddle);
    }
    // Match the former release response at middle gray without adding RGB
    // independently of the backdrop. Gain scales the completed response.
    vec3 channelGain = clamp((2.0 * alpha * color - vec3(alpha * alpha)) * exposure, 0.0, 1.0);
    // Overlay with Cs=(1+g)/2 gives Cb + g*min(Cb,1-Cb).
    // Each live backdrop channel contributes only its available headroom;
    // a colored pale backdrop can brighten without clipping to a white rim.
    vec3 encodedGain = (vec3(1.0) + channelGain) * 0.5;
    gl_FragColor = vec4(encodedGain, 1.0);
  }
`;
