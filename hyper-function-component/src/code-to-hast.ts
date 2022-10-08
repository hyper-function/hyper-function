// https://github.com/sachinraja/shiki-renderer-hast/blob/main/src/index.ts
import { h } from "hastscript";
import { FontStyle, Highlighter, IThemedToken, Lang } from "shiki-hfcpack";

type StringLiteralUnion<T extends U, U = string> = T | (U & {});

type LineOption = { line: number; classes?: string[] };

type HastRendererOptions = {
  langId?: string;
  lineOptions?: LineOption[];
};

const renderToHast = (
  lines: IThemedToken[][],
  options: HastRendererOptions = {}
) => {
  const optionsByLineNumber = groupBy(
    options.lineOptions ?? [],
    (option) => option.line
  );

  const root = h("pre", {
    class: "shiki",
  });

  const codeElement = h("code", { dataLang: options.langId });
  root.children.push(codeElement);

  for (const [lineIndex, line] of lines.entries()) {
    const lineNumber = lineIndex + 1;
    const lineOptions = optionsByLineNumber.get(lineNumber) ?? [];
    const lineClasses = getLineClasses(lineOptions);
    const lineSpan = h("span", { className: lineClasses });

    codeElement.children.push(lineSpan);

    for (const token of line) {
      const cssDeclarations: Record<string, string> = {};
      let cls = "";

      let color = token.color;
      if (color) {
        if (color === "#000001") cls += "sk-1";
        else if (color === "#000002") cls += "sk-2";
        else if (color === "#000003") cls += "sk-3";
        else if (color === "#000004") cls += "sk-4";
        else if (color === "#000005") cls += "sk-5";
        else if (color === "#000006") cls += "sk-6";
        else if (color === "#000007") cls += "sk-7";
        else if (color === "#000008") cls += "sk-8";
        else if (color === "#000009") cls += "sk-9";
        else if (color === "#000010") cls += "sk-10";
        else if (color === "#000011") cls += "sk-11";
        else if (color === "#000012") cls += "sk-12";
        else if (color === "#000013") cls += "sk-13";
        else if (color === "#000014") cls += "sk-14";
      }

      if (token.fontStyle) {
        if (FontStyle.Italic) {
          cls += "sk-i";
        } else if (FontStyle.Bold) {
          cls += "sk-b";
        } else if (FontStyle.Underline) {
          cls += "sk-u";
        }
      }

      lineSpan.children.push(
        h("p", { className: cls.length ? cls : undefined }, token.content)
      );
    }

    codeElement.children.push({ type: "text", value: "\n" });
  }

  codeElement.children.pop();

  return root;
};

/* eslint max-params: ["error", 5] */
export const codeToHast = (
  highlighter: Highlighter,
  code: string,
  lang: StringLiteralUnion<Lang> | undefined = "text",
  options?: HastRendererOptions
) => {
  const tokens = highlighter.codeToThemedTokens(code, lang, "hfcpack", {
    includeExplanation: false,
  });

  return renderToHast(tokens, options);
};

function groupBy<T, K>(
  elements: T[],
  keyGetter: (element: T) => K
): Map<K, T[]> {
  const map = new Map<K, T[]>();

  for (const element of elements) {
    const key = keyGetter(element);
    if (map.has(key)) {
      const group = map.get(key)!;
      group.push(element);
    } else {
      map.set(key, [element]);
    }
  }

  return map;
}

function getLineClasses(lineOptions: LineOption[]): string[] {
  const lineClasses = new Set(["line"]);

  for (const lineOption of lineOptions) {
    for (const lineClass of lineOption.classes ?? []) {
      lineClasses.add(lineClass);
    }
  }

  return Array.from(lineClasses);
}
