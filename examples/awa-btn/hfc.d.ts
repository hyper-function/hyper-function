interface User {
  name: HfcString;
  height: HfcFloat;
}

interface HfcPropType {
  attrs: {
    /**
     * The name bajsefjsajkfjselfjlsejfls
     * @default blabla
     */
    name: HfcString;
    aas3: HfcString;
    age: HfcInt;
    f: HfcFloat;
    a: HfcAny;
    girl: HfcBoolean;
    u: User;
    k: {
      name: HfcString;
      i: HfcInt;
    };
  };
  events: {
    /**
     * The hellooooo
     * @default blabla
     */
    hello: {};
    n: {};
    click: {};
  };
  slots: {
    /**
     *  header The hellooooo
     * @default blabla
     */
    header: {
      name: HfcString;
    };
    default: {};
  };
}
