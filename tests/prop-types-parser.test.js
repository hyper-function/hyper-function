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
    s: HfcString;
    b: HfcBoolean;
    i: HfcInt;
    f: HfcFloat;
    a: HfcAny;
    sa: HfcString[];
    ia: HfcInt[];
    o: {
      s1: HfcString;
      i1: HfcInt;
      sa1: HfcString[];
      ia1: HfcInt[];
      o1: {
        s2: HfcString;
        i2: HfcInt;
        sa2: HfcString[];
        ia2: HfcInt[];
      }
    },
    o2: {
      s: HfcString;
      o3: {
        s3: HfcString;
      }[]
    }[]
  }
  events: {
    e: {
      s: HfcString;
    }
  }
  slots: {
    s: {
      i: HfcInt;
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
