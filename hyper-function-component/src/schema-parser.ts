const codes = {
  bom: "\uFEFF",
  carriage: "\r",
  newline: "\n",
  space: " ",
  tab: "\t",
  colon: ":",
  comment: "#",
};

const bracketMatches = [
  { value: "{", type: "leftCurly" },
  { value: "}", type: "rightCurly" },
  { value: "[", type: "leftSquare" },
  { value: "]", type: "rightSquare" },
  { value: "(", type: "leftParen" },
  { value: ")", type: "rightParen" },
];

function isVaildChar(char: string) {
  if (char === undefined) return false;

  return (
    (char >= "a" && char <= "z") ||
    (char >= "A" && char <= "Z") ||
    (char >= "0" && char <= "9") ||
    char === "_" ||
    char === "."
  );
}

export function tokenizer(input: string) {
  let current = 0;
  let lineNumber = 1;
  let column = 1;
  let tokens = [];
  let str = "";
  let char;

  const len = input.length;
  while (current < len) {
    char = input[current];

    if (char === codes.newline) {
      lineNumber += 1;
      column = 1;
      current++;
      continue;
    }

    if (
      char === codes.space ||
      char === codes.carriage ||
      char === codes.tab ||
      char === codes.bom
    ) {
      column++;
      current++;
      continue;
    }

    if (char === codes.colon) {
      tokens.push({
        type: "colon",
        value: ":",
        offset: current,
        lineNumber,
        column,
      });

      column++;
      current++;
      continue;
    }

    let bracketMatched = false;
    for (const item of bracketMatches) {
      if (char === item.value) {
        bracketMatched = true;

        tokens.push({
          type: item.type,
          value: item.value,
          offset: current,
          lineNumber,
          column,
        });

        column++;
        current++;
        break;
      }
    }

    if (bracketMatched) continue;

    // comments
    if (char === codes.comment) {
      const commentColumn = column;
      const commentOffset = current;
      while (char !== codes.newline && char !== codes.carriage) {
        str += char;
        char = input[++current];
        column++;
      }

      tokens.push({
        type: "comment",
        value: str.slice(1),
        offset: commentOffset,
        column: commentColumn,
        lineNumber,
      });

      str = "";
      continue;
    }

    if (isVaildChar(char)) {
      const charOffset = current;
      const charColumn = column;
      while (isVaildChar(char)) {
        str += char;
        char = input[++current];
        column++;
      }

      tokens.push({
        type: "string",
        value: str,
        offset: charOffset,
        column: charColumn,
        lineNumber,
      });

      str = "";
      continue;
    }

    return [
      {
        type: "error",
        value: char,
        offset: current,
        lineNumber,
        column,
      },
    ];
  }

  return tokens;
}

const stringToBaseType: Record<string, any> = {
  String: "#s",
  Boolean: "#b",
  Int: "#i",
  Float: "#f",
  Any: "#a",
};

export function tokensToPropTypes(tokens: ReturnType<typeof tokenizer>) {
  const types: Record<string, any> = {};
  const stack: any[] = [];

  function isArray(pos: number) {
    let isArray = false;
    if (
      tokens[pos] &&
      tokens[pos].value === "[" &&
      tokens[pos + 1] &&
      tokens[pos + 1].value === "]"
    ) {
      isArray = true;
    }

    return isArray ? 1 : undefined;
  }

  function getComment(pos: number) {
    let comments: string[] = [];
    while (pos--) {
      const token = tokens[pos];
      if (token && token.type === "comment") {
        comments.unshift(token.value);
      } else {
        break;
      }
    }

    return comments.length ? comments.join("\n") : undefined;
  }

  let current = 0;
  const len = tokens.length;
  while (current < len) {
    const token = tokens[current];

    if (token.value === "{") {
      const prevToken = tokens[current - 1];
      if (prevToken.value === ":") {
        // field block
        const fieldNameToken = tokens[current - 2];

        const c = getComment(current - 2);
        const fieldItem = { t: {}, c };
        const parent = stack[stack.length - 1];
        parent.t[fieldNameToken.value] = fieldItem;
        stack.push(fieldItem);
      } else {
        // type block
        if (tokens[current - 2].value !== "type") {
          throw new Error(`Line ${token.lineNumber}: fail to parse`);
        }

        const typeNameToken = tokens[current - 1];

        const typeItem: Record<string, any> = { t: {} };

        types[typeNameToken.value] = typeItem.t;
        stack.push(typeItem);
      }
      current++;
      continue;
    }

    if (token.value === "}") {
      const parent = stack.pop();
      if (stack.length) {
        parent.a = isArray(current + 1);
      }
      current++;
      continue;
    }

    if (token.value === ":") {
      const typeToken = tokens[current + 1];
      if (typeToken.value === "{") {
        current++;
        continue;
      }

      const fieldNameToken = tokens[current - 1];
      const parent = stack[stack.length - 1];

      const a = isArray(current + 2);
      const c = getComment(current - 1);

      parent.t[fieldNameToken.value] = {
        t: stringToBaseType[typeToken.value] || typeToken.value,
        a,
        c,
      };

      current++;
      continue;
    }

    current++;
  }

  return types;
}

export function parse(content: string) {
  return tokensToPropTypes(tokenizer(content));
}

const schema = `
type Attrs {
  name: String
  age: Int
  height: Float
}

type Events {
  # heheasljfsef
  # ashefsef
  # asefse
  d: Any
  e: String
}

type Slots {
  user: User
  us: User[]
  s: {
    a: {
      r: {
        e: {
          a: Stt
          # basefss
          # haihih
          o: {
            b: String[]
          }[]
        }
      }
    }
  }[]
}
`;

// console.log(JSON.stringify(tokensToPropTypes(tokenizer(schema)), null, 2));
