import { glassFragmentShader, glassVertexShader } from './shader';

export type GlassGl = WebGLRenderingContext | WebGL2RenderingContext;

const createShader = (gl: GlassGl, type: number, source: string): WebGLShader | undefined => {
  const shader = gl.createShader(type);
  if (shader === null) {
    return undefined;
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return undefined;
  }

  return shader;
};

export const createProgram = (gl: GlassGl): WebGLProgram | undefined => {
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, glassVertexShader);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, glassFragmentShader);
  if (vertexShader === undefined || fragmentShader === undefined) {
    if (vertexShader !== undefined) {
      gl.deleteShader(vertexShader);
    }
    if (fragmentShader !== undefined) {
      gl.deleteShader(fragmentShader);
    }
    return undefined;
  }

  const program = gl.createProgram();
  if (program === null) {
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    return undefined;
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return undefined;
  }

  return program;
};
