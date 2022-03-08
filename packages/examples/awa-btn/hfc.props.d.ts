interface User {
  name: String;
  height: Float;
}

interface HD {
  w: String;
}

interface HfcPropType {
  attrs: {
    /**
     * The name bajsefjsajkfjselfjlsejfls
     * @default blabla
     */
    name: String;
    aas3: String;
    age: Int;
    u: User;
    k: {
      name: String;
      i: Int;
    };
  };
  events: {
    /**
     * The hellooooo
     * @default blabla
     */
    hello: {
      /**
       * aa The fwefwefweqq
       * @default blabla
       */
      a: HD;
    };
    n: {};
  };
  slots: {
    /**
     *  header The hellooooo
     * @default blabla
     */
    header: {
      name: String;
    };
  };
}
