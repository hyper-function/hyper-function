// Type definitions for hyper-function-component 2.0
// Project: https://hyper-function.com/hfc/intro
// Definitions by: terry-fei <https://github.com/terry-fei>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped

declare class HyperFunctionComponent {
  static tag: string;
  static ver: string;
  static name: string;
  // [AttrNames, EventNames, SlotNames]
  static props: [string[], string[], string[]];
  constructor(container: Element, props: HfcProps);
  changed(props: HfcProps): void;
  disconnected(): void;
}

interface HfcProps {
  attrs: { [k: string]: any };
  events: { [k: string]: (args?: { [k: string]: any }) => any };
  slots: {
    [k: string]: (
      container: Element,
      args?: { key?: string; [k: string]: any }
    ) => void;
  };
  others: { [k: string]: any };
}

declare module "@hyper.fun/*";
