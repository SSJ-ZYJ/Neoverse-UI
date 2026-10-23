export const mergeClassNames = (...values: Array<string | false | null | undefined>): string =>
  values.filter(Boolean).join(' ');
