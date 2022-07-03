// This is example of how to write hfc.d.ts
// Please remove unused content

interface HfcPropType {
  attrs: {
    /**
     * Description for this field
     * @default "default value"
     */
    name: HfcString;
    age: HfcInt;
    weight: HfcFloat;
    adult: HfcBoolean;
    any: HfcAny;
    address: Address;
    hobbies: HfcString[];
  };
  events: {
    sleep: {
      duration: HfcInt;
    };
  };
  slots: {
    clothes: {
      color: HfcString;
    };
  };
}

interface Address {
  country: HfcString;
  city: HfcString;
}
