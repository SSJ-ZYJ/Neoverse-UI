import ts from 'typescript';

export interface ReactRuntimeAdapterAnalysis {
  adapters: Set<string>;
  errors: string[];
}

function jsxTagName(tag: ts.JsxTagNameExpression): string | undefined {
  if (ts.isIdentifier(tag)) return tag.text;
  if (ts.isPropertyAccessExpression(tag)) return tag.name.text;
  return undefined;
}

function containsComponent(node: ts.Node, componentName: string): boolean {
  let found = false;

  const visit = (current: ts.Node): void => {
    if (found) return;

    if (
      (ts.isJsxOpeningElement(current) || ts.isJsxSelfClosingElement(current)) &&
      jsxTagName(current.tagName) === componentName
    ) {
      found = true;
      return;
    }

    ts.forEachChild(current, visit);
  };

  visit(node);
  return found;
}

export function collectReactRuntimeAdapters(sourceText: string): ReactRuntimeAdapterAnalysis {
  const source = ts.createSourceFile(
    'react-runtime-fixture.tsx',
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const adapters = new Set<string>();
  const errors: string[] = [];

  const visit = (node: ts.Node): void => {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const marker = node.attributes.properties.find(
        (property): property is ts.JsxAttribute =>
          ts.isJsxAttribute(property) && property.name.getText(source) === 'data-react-adapter',
      );
      const initializer = marker?.initializer;

      if (initializer !== undefined && ts.isStringLiteral(initializer)) {
        const componentName = initializer.text;
        if (/^Ui[A-Za-z0-9]+$/.test(componentName)) {
          adapters.add(componentName);
          const element = ts.isJsxSelfClosingElement(node) ? node : node.parent;
          if (
            (!ts.isJsxElement(element) && !ts.isJsxSelfClosingElement(element)) ||
            !containsComponent(element, componentName)
          ) {
            errors.push(
              `${componentName}: runtime marker does not contain a matching JSX component.`,
            );
          }
        } else {
          errors.push(`Invalid React runtime adapter marker: ${componentName}`);
        }
      }
    }

    ts.forEachChild(node, visit);
  };

  visit(source);
  return { adapters, errors };
}
