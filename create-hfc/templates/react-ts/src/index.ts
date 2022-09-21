import { Options, toHFC, toHFCReact } from "react-to-hfc";
import Component from "./component";

const opts: Options = {
  tag: "div",
  // @ts-ignore
  hfc: process.env.HFC_NAME,
  // @ts-ignore
  ver: process.env.HFC_VERSION,
  // @ts-ignore
  names: process.env.HFC_PROP_NAMES,
  connected(container) {},
  disconnected() {},
};

export default toHFC(Component, opts);
export let ReactHFC = toHFCReact(Component, opts);
