import { expect } from 'bun:test';

export type ShadowLayer = [boolean, number, number, number, number];

const splitShadowLayers = (value: string): string[] => {
  const layers: string[] = [];
  let start = 0;
  let parentheses = 0;

  for (let index = 0; index < value.length; index += 1) {
    if (value[index] === '(') {
      parentheses += 1;
    } else if (value[index] === ')') {
      parentheses -= 1;
    } else if (value[index] === ',' && parentheses === 0) {
      layers.push(value.slice(start, index).trim());
      start = index + 1;
    }
  }

  layers.push(value.slice(start).trim());
  return layers;
};

export const parseShadowLayers = (value: string): ShadowLayer[] =>
  splitShadowLayers(value).map((layer) => {
    const match =
      /^(inset\s+)?(-?[\d.]+(?:px|rem)?)\s+(-?[\d.]+(?:px|rem)?)\s+([\d.]+(?:px|rem)?)(?:\s+(-?[\d.]+(?:px|rem)?))?/.exec(
        layer,
      );

    if (match === null) {
      throw new Error(`Unable to parse shadow layer: ${layer}`);
    }

    const offsetX = match[2];
    const offsetY = match[3];
    const blur = match[4];
    const spread = match[5] ?? '0';

    if (offsetX === undefined || offsetY === undefined || blur === undefined) {
      throw new Error(`Incomplete shadow layer: ${layer}`);
    }

    const toPx = (token: string): number =>
      Number.parseFloat(token) * (token.endsWith('rem') ? 16 : 1);

    return [match[1] !== undefined, toPx(offsetX), toPx(offsetY), toPx(blur), toPx(spread)];
  });

export const firstShadowLayer = (value: string): ShadowLayer => {
  const layer = parseShadowLayers(value)[0];

  if (layer === undefined) {
    throw new Error(`Missing shadow layer: ${value}`);
  }

  return layer;
};

export const shadowDeclarations = (css: string, name: string): string[] =>
  [...css.matchAll(new RegExp(`--neoverse-shadow-${name}:\\s*([^;]+)`, 'g'))].flatMap((match) =>
    match[1] === undefined ? [] : [match[1].trim()],
  );

export const shadowReach = ([, offsetX, offsetY, blur, spread]: ShadowLayer): number =>
  Math.abs(offsetX) + Math.abs(offsetY) + blur + spread;

export const normalizeCss = (css: string): string => css.replace(/\r\n?/g, '\n');

export const readCssFile = async (file: URL): Promise<string> =>
  normalizeCss(await Bun.file(file).text());

export const readTokenCss = async (fileName: string): Promise<string> => {
  const localFile = Bun.file(new URL(`../${fileName}`, import.meta.url));

  if (await localFile.exists()) {
    return normalizeCss(await localFile.text());
  }

  return normalizeCss(await Bun.file(new URL(`../../src/${fileName}`, import.meta.url)).text());
};

export const readBuiltTokenCss = (): Promise<string> =>
  readCssFile(new URL('../../dist/tokens.css', import.meta.url));

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const extractCssBlock = (css: string, selector: string): string => {
  const selectorPattern = selector.trim().split(/\s+/).map(escapeRegExp).join('\\s*');
  const selectorMatch = new RegExp(`${selectorPattern}\\s*\\{`).exec(css);
  const selectorIndex = selectorMatch?.index ?? -1;
  const openingBrace = selectorMatch === null ? -1 : css.indexOf('{', selectorIndex);

  if (selectorIndex < 0 || openingBrace < 0) {
    throw new Error(`Unable to find selector block: ${selector}`);
  }

  let depth = 0;
  for (let index = openingBrace; index < css.length; index += 1) {
    if (css[index] === '{') {
      depth += 1;
    } else if (css[index] === '}') {
      depth -= 1;
      if (depth === 0) {
        return css.slice(openingBrace + 1, index);
      }
    }
  }

  throw new Error(`Unclosed selector block: ${selector}`);
};

export { expect };
