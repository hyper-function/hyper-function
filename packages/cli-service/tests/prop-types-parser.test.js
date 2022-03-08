const os = require("os");
const fs = require("fs");
const path = require("path");
const parse = require("../dist/prop-types-parser").default;

function writeToTmpFile(string) {
  const tmpPath = path.join(
    os.tmpdir(),
    Math.random().toString(36).slice(1) + ".d.ts"
  );
  fs.writeFileSync(tmpPath, string);
  return tmpPath;
}

describe("Hfc Prop Type Parser Tests", () => {
  it("should parse", () => {
    const tmpPath = writeToTmpFile(`\
interface HfcPropType {
  attrs: {
    s: String;
    b: Boolean;
    i: Int;
    f: Float;
    a: Any;
    sa: String[];
    ia: Int[];
    o: {
      s1: String;
      i1: Int;
      sa1: String[];
      ia1: Int[];
      o1: {
        s2: String;
        i2: Int;
        sa2: String[];
        ia2: Int[];
      }
    },
    o2: {
      s: String;
      o3: {
        s3: String;
      }[]
    }[]
  }
  events: {
    e: {
      s: String;
    }
  }
  slots: {
    s: {
      i: Int;
    }
  }
}
`);
    const res = parse(tmpPath);
    fs.rmSync(tmpPath);

    expect(JSON.stringify(res.minResult)).toBe(
      '{"attrs":{"s":{"t":"#s"},"b":{"t":"#b"},"i":{"t":"#i"},"f":{"t":"#f"},"a":{"t":"#a"},"sa":{"arr":1,"t":"#s"},"ia":{"arr":1,"t":"#i"},"o":{"t":{"s1":{"t":"#s"},"i1":{"t":"#i"},"sa1":{"arr":1,"t":"#s"},"ia1":{"arr":1,"t":"#i"},"o1":{"t":{"s2":{"t":"#s"},"i2":{"t":"#i"},"sa2":{"arr":1,"t":"#s"},"ia2":{"arr":1,"t":"#i"}}}}},"o2":{"arr":1,"t":{"s":{"t":"#s"},"o3":{"arr":1,"t":{"s3":{"t":"#s"}}}}}},"events":{"e":{"s":{"t":"#s"}}},"slots":{"s":{"i":{"t":"#i"}}},"_t":{}}'
    );
  });
});
