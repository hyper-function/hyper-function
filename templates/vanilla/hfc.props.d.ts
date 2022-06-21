interface HfcPropType {
  attrs: {
    name: HfcString[];
    age: HfcInt[];
    height: HfcFloat;
    good: HfcBoolean;
    co: HfcAny;
    u: User[];
  };
  events: {
    hello: {
      name: HfcString;
    };
  };
  slots: {};
}

interface User {
  name: HfcString;
}
