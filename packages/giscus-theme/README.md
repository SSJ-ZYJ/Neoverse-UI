# @neoverse-ui/giscus-theme

Standalone light and dark Giscus themes for Neoverse products.

The Giscus widget renders in a cross-origin iframe, so it cannot consume host-page CSS variables directly. This package keeps the iframe theme in the design system and publishes self-contained CSS assets for consumers to copy to a public HTTPS origin.

## Exports

- `@neoverse-ui/giscus-theme/light.css`
- `@neoverse-ui/giscus-theme/dark.css`

Consumers should serve the copied CSS through HTTPS and pass that URL to Giscus. Do not use a local HTTP URL from an HTTPS Giscus iframe.
