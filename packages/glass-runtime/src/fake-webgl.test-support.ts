import { vi } from 'vitest';

type FakeGl = {
  ARRAY_BUFFER: number;
  BLEND: number;
  COLOR_BUFFER_BIT: number;
  COMPILE_STATUS: number;
  FRAGMENT_SHADER: number;
  FLOAT: number;
  LINK_STATUS: number;
  SRC_ALPHA: number;
  ONE: number;
  ONE_MINUS_SRC_ALPHA: number;
  TEXTURE0: number;
  TEXTURE_2D: number;
  TEXTURE_MIN_FILTER: number;
  TEXTURE_MAG_FILTER: number;
  TEXTURE_WRAP_S: number;
  TEXTURE_WRAP_T: number;
  LINEAR: number;
  CLAMP_TO_EDGE: number;
  RGBA: number;
  UNSIGNED_BYTE: number;
  activeTexture: ReturnType<typeof vi.fn>;
  bindTexture: ReturnType<typeof vi.fn>;
  createTexture: ReturnType<typeof vi.fn>;
  deleteTexture: ReturnType<typeof vi.fn>;
  texParameteri: ReturnType<typeof vi.fn>;
  texImage2D: ReturnType<typeof vi.fn>;
  uniform1i: ReturnType<typeof vi.fn>;
  SCISSOR_TEST: number;
  STATIC_DRAW: number;
  TRIANGLE_STRIP: number;
  VERTEX_SHADER: number;
  attachShader: ReturnType<typeof vi.fn>;
  bindBuffer: ReturnType<typeof vi.fn>;
  blendFunc: ReturnType<typeof vi.fn>;
  blendFuncSeparate: ReturnType<typeof vi.fn>;
  bufferData: ReturnType<typeof vi.fn>;
  clear: ReturnType<typeof vi.fn>;
  clearColor: ReturnType<typeof vi.fn>;
  compileShader: ReturnType<typeof vi.fn>;
  createBuffer: ReturnType<typeof vi.fn>;
  createProgram: ReturnType<typeof vi.fn>;
  createShader: ReturnType<typeof vi.fn>;
  deleteBuffer: ReturnType<typeof vi.fn>;
  deleteProgram: ReturnType<typeof vi.fn>;
  deleteShader: ReturnType<typeof vi.fn>;
  drawArrays: ReturnType<typeof vi.fn>;
  disable: ReturnType<typeof vi.fn>;
  enable: ReturnType<typeof vi.fn>;
  enableVertexAttribArray: ReturnType<typeof vi.fn>;
  getAttribLocation: ReturnType<typeof vi.fn>;
  getProgramParameter: ReturnType<typeof vi.fn>;
  getShaderParameter: ReturnType<typeof vi.fn>;
  getUniformLocation: ReturnType<typeof vi.fn>;
  linkProgram: ReturnType<typeof vi.fn>;
  shaderSource: ReturnType<typeof vi.fn>;
  scissor: ReturnType<typeof vi.fn>;
  uniform1f: ReturnType<typeof vi.fn>;
  uniform2f: ReturnType<typeof vi.fn>;
  uniform3f: ReturnType<typeof vi.fn>;
  uniform4f: ReturnType<typeof vi.fn>;
  uniform4fv: ReturnType<typeof vi.fn>;
  uniform1fv: ReturnType<typeof vi.fn>;
  useProgram: ReturnType<typeof vi.fn>;
  vertexAttribPointer: ReturnType<typeof vi.fn>;
  viewport: ReturnType<typeof vi.fn>;
};

/** Create a WebGL stub that records renderer calls */
export const createFakeGl = (): FakeGl => {
  const gl = {
    ARRAY_BUFFER: 0x8892,
    BLEND: 0x0be2,
    COLOR_BUFFER_BIT: 0x4000,
    COMPILE_STATUS: 0x8b81,
    FRAGMENT_SHADER: 0x8b30,
    FLOAT: 0x1406,
    LINK_STATUS: 0x8b82,
    SRC_ALPHA: 0x0302,
    ONE: 1,
    ONE_MINUS_SRC_ALPHA: 0x0303,
    TEXTURE0: 0x84c0,
    TEXTURE_2D: 0x0de1,
    TEXTURE_MIN_FILTER: 0x2801,
    TEXTURE_MAG_FILTER: 0x2800,
    TEXTURE_WRAP_S: 0x2802,
    TEXTURE_WRAP_T: 0x2803,
    LINEAR: 0x2601,
    CLAMP_TO_EDGE: 0x812f,
    RGBA: 0x1908,
    UNSIGNED_BYTE: 0x1401,
    activeTexture: vi.fn(),
    bindTexture: vi.fn(),
    createTexture: vi.fn(() => ({})),
    deleteTexture: vi.fn(),
    texParameteri: vi.fn(),
    texImage2D: vi.fn(),
    uniform1i: vi.fn(),
    SCISSOR_TEST: 0x0c11,
    STATIC_DRAW: 0x88e4,
    TRIANGLE_STRIP: 0x0005,
    VERTEX_SHADER: 0x8b31,
    attachShader: vi.fn(),
    bindBuffer: vi.fn(),
    blendFunc: vi.fn(),
    blendFuncSeparate: vi.fn(),
    bufferData: vi.fn(),
    clear: vi.fn(),
    clearColor: vi.fn(),
    compileShader: vi.fn(),
    createBuffer: vi.fn(() => ({})),
    createProgram: vi.fn(() => ({})),
    createShader: vi.fn(() => ({})),
    deleteBuffer: vi.fn(),
    deleteProgram: vi.fn(),
    deleteShader: vi.fn(),
    drawArrays: vi.fn(),
    disable: vi.fn(),
    enable: vi.fn(),
    enableVertexAttribArray: vi.fn(),
    getAttribLocation: vi.fn(() => 0),
    getProgramParameter: vi.fn(() => true),
    getShaderParameter: vi.fn(() => true),
    getUniformLocation: vi.fn((_, name: string) => ({ name })),
    linkProgram: vi.fn(),
    shaderSource: vi.fn(),
    scissor: vi.fn(),
    uniform1f: vi.fn(),
    uniform2f: vi.fn(),
    uniform3f: vi.fn(),
    uniform4f: vi.fn(),
    uniform4fv: vi.fn(),
    uniform1fv: vi.fn(),
    useProgram: vi.fn(),
    vertexAttribPointer: vi.fn(),
    viewport: vi.fn(),
  } satisfies FakeGl;

  return gl;
};

/** Override canvas context selection for a renderer test */
export const installCanvasContext = (contexts: { webgl2?: FakeGl; webgl?: FakeGl } = {}): void => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation((kind) => {
    if (kind === 'webgl2') {
      return (contexts.webgl2 ?? null) as never;
    }
    if (kind === 'webgl') {
      return (contexts.webgl ?? null) as never;
    }
    return null as never;
  });
};
