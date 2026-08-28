export default {
  ignoreFiles: ['**/dist/**', '**/node_modules/**'],
  rules: {
    'custom-property-pattern': ['^-{0,2}[a-z][a-z0-9-]*(?:--[a-z][a-z0-9-]*)?$'],
  },
};
